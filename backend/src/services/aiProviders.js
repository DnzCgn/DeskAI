const REQUEST_TIMEOUT_MS = 15000;

const PROVIDERS = {
  deepseek_v4_flash: {
    name: 'deepseek_v4_flash',
    model: 'deepseek-chat',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: () => process.env.DEEPSEEK_API_KEY,
    type: 'openai',
  },
  gemini: {
    name: 'gemini',
    model: 'gemini-2.5-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: () => process.env.GEMINI_API_KEY,
    type: 'google',
  },
};

function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function resolveProviderConfig(providerName) {
  const config = PROVIDERS[providerName];
  if (!config) return null;
  return { ...config, apiKey: config.apiKey() };
}

function getReasoningProviderChain(orgConfig = {}) {
  const primary = orgConfig.reasoningProvider || 'deepseek_v4_flash';
  const fallbacks = orgConfig.secondaryReasoningProviders || [];
  return [primary, ...fallbacks].filter((name) => PROVIDERS[name]);
}

async function callReasoning(messages, orgConfig = {}) {
  const chain = getReasoningProviderChain(orgConfig);
  let lastError = null;

  for (const providerName of chain) {
    try {
      const config = resolveProviderConfig(providerName);
      if (!config || !config.apiKey) {
        lastError = new Error(`Provider ${providerName} not configured`);
        continue;
      }

      if (config.type === 'openai') {
        return await callOpenAI(config, messages);
      }
      if (config.type === 'google') {
        return await callGoogleAI(config, messages);
      }

      throw new Error(`Unknown provider type: ${config.type}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All reasoning providers failed');
}

async function callOpenAI(config, messages) {
  const url = `${config.baseURL}/chat/completions`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGoogleAI(config, messages) {
  const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMsgs = messages.filter((m) => m.role !== 'system');

  const contents = chatMsgs.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }
  body.generationConfig = { responseMimeType: 'application/json', maxOutputTokens: 1024 };

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function callSpeechSTT(audioBase64, orgConfig = {}) {
  const speechProvider = orgConfig.speechProvider || 'gemini';
  const config = resolveProviderConfig(speechProvider);
  if (!config || !config.apiKey) {
    throw new Error(`Speech provider ${speechProvider} not configured`);
  }

  if (config.type === 'google') {
    const url = `${config.baseURL}/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`;
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ inlineData: { mimeType: 'audio/wav', data: audioBase64 } }],
        }],
        generationConfig: { maxOutputTokens: 256 },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Speech STT error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error(`Speech STT not supported for provider: ${config.type}`);
}

async function callSpeechTTS(text, orgConfig = {}) {
  const speechProvider = orgConfig.speechProvider || 'gemini';
  const config = resolveProviderConfig(speechProvider);
  if (!config || !config.apiKey) {
    throw new Error(`Speech provider ${speechProvider} not configured`);
  }

  if (config.type === 'google') {
    const url = `${config.baseURL}/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`;
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `Speak the following text naturally: ${text}` }],
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Speech TTS error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const audioPart = data.candidates[0].content.parts.find((p) => p.inlineData);
    return audioPart ? audioPart.inlineData.data : null;
  }

  throw new Error(`Speech TTS not supported for provider: ${config.type}`);
}

module.exports = {
  PROVIDERS,
  resolveProviderConfig,
  getReasoningProviderChain,
  callReasoning,
  callSpeechSTT,
  callSpeechTTS,
};
