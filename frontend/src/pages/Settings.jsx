import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import FadeIn from '../components/FadeIn';
import GlowCard from '../components/GlowCard';

const THEMES = [
  { id: 'light_green_black', label: 'Green + Black', colors: 'from-emerald-500 to-zinc-950' },
  { id: 'light_green_white', label: 'Green + White', colors: 'from-emerald-500 to-zinc-100' },
  { id: 'light_orange_black', label: 'Orange + Black', colors: 'from-orange-500 to-zinc-950' },
  { id: 'light_orange_white', label: 'Orange + White', colors: 'from-orange-500 to-zinc-100' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'tr', label: 'Turkish' },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [assistantName, setAssistantName] = useState('');
  const [assistantVoice, setAssistantVoice] = useState('');
  const [wakePhrase, setWakePhrase] = useState('');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light_green_black');
  const [keyboardShortcut, setKeyboardShortcut] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setAssistantName(data.user.assistantName || '');
        setAssistantVoice(data.user.assistantVoice || '');
        setWakePhrase(data.user.wakePhrase || '');
        setLanguage(data.user.languagePreference || 'en');
        setTheme(data.user.colorTheme || 'light_green_black');
        setKeyboardShortcut(data.user.keyboardShortcut || '');
      })
      .catch(() => setToast('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleSave(e) {
    e.preventDefault();
    const toastKey = Date.now();
    setSaving(true);
    try {
      await api.put('/auth/profile', {
        assistantName: assistantName || null,
        assistantVoice: assistantVoice || null,
        wakePhrase: wakePhrase || null,
        languagePreference: language,
        colorTheme: theme,
        keyboardShortcut: keyboardShortcut || null,
      });
      setToast({ text: 'Settings saved', key: toastKey });
    } catch {
      setToast({ text: 'Failed to save settings', key: toastKey });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && (
        <motion.div
          key={toast.key}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg ${toast.text === 'Settings saved' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {toast.text}
        </motion.div>
      )}

      <FadeIn>
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="text-zinc-400 mt-1">Personalize your DESKA experience</p>
      </FadeIn>

      <form onSubmit={handleSave} className="space-y-8">
        <FadeIn delay={0.05}>
          <GlowCard>
            <h3 className="text-lg font-semibold text-white mb-4">Assistant</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Assistant name</label>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="My Assistant"
                  className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Voice</label>
                <input
                  type="text"
                  value={assistantVoice}
                  onChange={(e) => setAssistantVoice(e.target.value)}
                  placeholder="Default voice"
                  className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Wake phrase</label>
                <input
                  type="text"
                  value={wakePhrase}
                  onChange={(e) => setWakePhrase(e.target.value)}
                  placeholder="hey deska"
                  className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Keyboard shortcut</label>
                <input
                  type="text"
                  value={keyboardShortcut}
                  onChange={(e) => setKeyboardShortcut(e.target.value)}
                  placeholder="Ctrl+Shift+D"
                  className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>
          </GlowCard>
        </FadeIn>

        <FadeIn delay={0.1}>
          <GlowCard>
            <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Color theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${theme === t.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-700/50 hover:border-zinc-600'}`}
                    >
                      <div className={`h-4 w-full rounded-md bg-gradient-to-r ${t.colors} mb-1.5`} />
                      <span className="text-xs text-zinc-300">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Language</label>
                <div className="space-y-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${language === l.id ? 'border-emerald-500/50 bg-emerald-500/5 text-white' : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-600'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlowCard>
        </FadeIn>

        <FadeIn delay={0.15}>
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </motion.button>
        </FadeIn>
      </form>
    </div>
  );
}
