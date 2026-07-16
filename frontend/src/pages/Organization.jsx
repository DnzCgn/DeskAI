import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import FadeIn from '../components/FadeIn';
import GlowCard from '../components/GlowCard';
import RequireRole from '../components/RequireRole';

const FEATURE_FLAGS = [
  'learningMode', 'remoteControl', 'performanceAnalytics', 'policyTemplates',
  'actionMarketplace', 'multiProfileMachines', 'complianceExport', 'customVoiceBranding',
  'bringYourOwnApiKey', 'thirdPartyFunctionsEnabled', 'detailedActivityLogging',
  'aiHttpRequestsEnabled', 'multiDeviceSync', 'hrModule',
];

const PROVIDERS = ['deepseek_v4_flash', 'gemini'];

const QUOTA_STATUSES = ['healthy', 'low', 'exhausted'];

function flagLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

export default function Organization() {
  return (
    <RequireRole roles={['owner', 'company_admin']}>
      <OrgContent />
    </RequireRole>
  );
}

function OrgContent() {
  const [org, setOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [name, setName] = useState('');
  const [flags, setFlags] = useState({});
  const [displayName, setDisplayName] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  const [reasoningProvider, setReasoningProvider] = useState('deepseek_v4_flash');
  const [speechProvider, setSpeechProvider] = useState('gemini');
  const [lockdownActive, setLockdownActive] = useState(false);
  const [tokenQuotaStatus, setTokenQuotaStatus] = useState('healthy');

  useEffect(() => {
    Promise.all([
      api.get('/org').then(({ data }) => data.org),
      api.get('/auth/me').then(({ data }) => data.user),
    ])
      .then(([orgData, userData]) => {
        setOrg(orgData);
        setUser(userData);
        setName(orgData.name || '');
        setFlags(orgData.featureFlags || {});
        setDisplayName(orgData.branding?.displayName || '');
        setAssistantName(orgData.branding?.defaultAssistantName || '');
        setSupportEmail(orgData.branding?.supportEmail || '');
        setSupportUrl(orgData.branding?.supportUrl || '');
        setReasoningProvider(orgData.reasoningProvider || 'deepseek_v4_flash');
        setSpeechProvider(orgData.speechProvider || 'gemini');
        setLockdownActive(orgData.lockdownActive || false);
        setTokenQuotaStatus(orgData.tokenQuotaStatus || 'healthy');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name,
        featureFlags: { ...flags },
        branding: {
          displayName: displayName || null,
          defaultAssistantName: assistantName || null,
          supportEmail: supportEmail || null,
          supportUrl: supportUrl || null,
        },
        reasoningProvider,
        speechProvider,
      };
      if (user?.role === 'owner') {
        payload.lockdownActive = lockdownActive;
        payload.tokenQuotaStatus = tokenQuotaStatus;
      }
      const { data } = await api.put('/org', payload);
      setOrg(data.org);
      setToast({ text: 'Settings saved', key: Date.now() });
    } catch (err) {
      setToast({ text: err.response?.data?.error || 'Failed to save', key: Date.now() });
    } finally {
      setSaving(false);
    }
  }

  function toggleFlag(key) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <FadeIn>
        <div className="text-center py-20">
          <p className="text-zinc-400">No organization found. Create one to get started.</p>
        </div>
      </FadeIn>
    );
  }

  const planLabel = org.plan?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const isOwner = user?.role === 'owner';

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Organization</h2>
            <p className="text-zinc-400 mt-1">Configuration and plan settings</p>
          </div>
          <motion.button
            type="button"
            disabled={saving}
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </motion.button>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlowCard>
            <h3 className="text-lg font-semibold text-white mb-1">Plan</h3>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {planLabel}
            </span>
            <p className="text-zinc-500 text-xs mt-2">Slug: {org.slug}</p>
          </GlowCard>
          <GlowCard>
            <h3 className="text-lg font-semibold text-white mb-1">Token Quota</h3>
            {isOwner ? (
              <select
                value={tokenQuotaStatus}
                onChange={(e) => setTokenQuotaStatus(e.target.value)}
                className="px-3 py-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {QUOTA_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p className={`text-xl font-bold capitalize ${
                tokenQuotaStatus === 'healthy' ? 'text-emerald-400' :
                tokenQuotaStatus === 'low' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {tokenQuotaStatus}
              </p>
            )}
          </GlowCard>
          <GlowCard>
            <h3 className="text-lg font-semibold text-white mb-1">Lockdown</h3>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setLockdownActive(!lockdownActive)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  lockdownActive
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                }`}
              >
                {lockdownActive ? '🔒 Active — Click to disable' : 'Unlocked'}
              </button>
            ) : (
              <p className={`text-xl font-bold ${lockdownActive ? 'text-red-400' : 'text-emerald-400'}`}>
                {lockdownActive ? 'Active' : 'Inactive'}
              </p>
            )}
          </GlowCard>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <GlowCard>
          <h3 className="text-lg font-semibold text-white mb-4">General</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Organization name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">AI Reasoning Provider</label>
              <select
                value={reasoningProvider}
                onChange={(e) => setReasoningProvider(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">AI Speech Provider</label>
              <select
                value={speechProvider}
                onChange={(e) => setSpeechProvider(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </GlowCard>
      </FadeIn>

      <FadeIn delay={0.15}>
        <GlowCard>
          <h3 className="text-lg font-semibold text-white mb-4">Branding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Company"
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Default assistant name</label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="DESKA"
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Support email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@company.com"
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Support URL</label>
              <input
                type="url"
                value={supportUrl}
                onChange={(e) => setSupportUrl(e.target.value)}
                placeholder="https://company.com/support"
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </GlowCard>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Flags</h3>
          <p className="text-zinc-500 text-sm mb-4">Click a flag to toggle it. Changes take effect immediately after saving.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FEATURE_FLAGS.map((key) => {
              const value = flags[key] || false;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFlag(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all text-left ${
                    value
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                      : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                  {flagLabel(key)}
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
