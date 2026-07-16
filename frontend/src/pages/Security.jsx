import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import api from '../lib/api';
import FadeIn from '../components/FadeIn';

export default function Security() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState('idle');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (uri && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, uri, { width: 200, margin: 2, color: { dark: '#10b981', light: '#18181b' } });
    }
  }, [uri]);

  async function handleStartSetup() {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/mfa/setup');
      setSecret(data.secret);
      setUri(data.uri);
      setSetupStep('verify');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start MFA setup');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/mfa/verify', { token: verifyCode });
      setSuccess('MFA enabled successfully');
      setSetupStep('enabled');
      setSecret('');
      setUri('');
      setUser((prev) => prev ? { ...prev, mfaEnabled: true } : null);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid MFA code');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setSetupStep('idle');
    setSecret('');
    setUri('');
    setVerifyCode('');
    setError('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <FadeIn>
        <h2 className="text-2xl font-semibold text-white">Security</h2>
        <p className="text-zinc-400 mt-1">Manage two-factor authentication</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
              <p className="text-zinc-400 text-sm mt-1">
                {user?.mfaEnabled
                  ? 'MFA is enabled. Your account is protected with an additional verification step.'
                  : 'Add an extra layer of security by requiring a time-based one-time code when signing in.'}
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
              user?.mfaEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-zinc-700/30 text-zinc-400 border-zinc-700/50'
            }`}>
              {user?.mfaEnabled ? 'Enabled' : 'Not set'}
            </span>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
            >
              {success}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                <p className="text-sm text-zinc-300 mb-4">
                  Scan this QR code with your authenticator app, then enter the code below to verify.
                </p>
                <div className="flex justify-center mb-4">
                  <canvas ref={canvasRef} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 text-center">Or enter this setup key manually:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="px-4 py-2 bg-zinc-800 rounded-lg text-emerald-400 text-sm font-mono tracking-wider select-all">
                      {secret}
                    </code>                      <button
                        onClick={() => { navigator.clipboard.writeText(secret).catch(() => {}); }}
                      className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={submitting || verifyCode.length < 6}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                  >
                    {submitting ? 'Verifying…' : 'Verify & Enable'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {setupStep === 'idle' && !user?.mfaEnabled && (
            <motion.button
              onClick={handleStartSetup}
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
            >
              {submitting ? 'Starting…' : 'Set up MFA'}
            </motion.button>
          )}

          {setupStep === 'enabled' && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-white font-medium">MFA is active</p>
                <p className="text-zinc-400 text-sm">Your account is protected with two-factor authentication.</p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {user?.mfaEnabled && (
        <FadeIn delay={0.15}>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recovery Note</h3>
            <p className="text-zinc-400 text-sm">
              If you lose access to your authenticator app, contact your organization admin to reset MFA. 
              Keep your recovery codes in a safe place.
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
