import { useEffect, useState } from 'react';
import api from '../lib/api';
import GlowCard from '../components/GlowCard';
import FadeIn from '../components/FadeIn';

const ADMIN_ROLES = ['owner', 'company_admin', 'department_manager'];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [stats, setStats] = useState({ devices: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: me } = await api.get('/auth/me', { timeout: 8000 });
        setUser(me.user);

        const isAdmin = ADMIN_ROLES.includes(me.user.role);
        const promises = [];

        if (me.user.organization) {
          promises.push(api.get('/org').then(({ data }) => setOrg(data.org)).catch(() => {}));
        }

        if (isAdmin) {
          promises.push(
            api.get('/devices').then(({ data }) =>
              setStats((s) => ({ ...s, devices: (data.devices || []).length }))
            ).catch(() => {}),
            api.get('/auth/users').then(({ data }) =>
              setStats((s) => ({ ...s, users: (data.users || []).length }))
            ).catch(() => {}),
          );
        }

        await Promise.allSettled(promises);
      } catch {
        setError('Failed to load account data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <FadeIn>
        <div className="text-center py-20">
          <p className="text-zinc-400">{error || 'Unable to load account data'}</p>
        </div>
      </FadeIn>
    );
  }

  const isAdmin = ADMIN_ROLES.includes(user.role);
  const planLabel = org?.plan?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Personal Free';

  const userCards = [
    { title: 'Email', value: user.email, icon: '📧', desc: 'account', mono: true },
    { title: 'Role', value: user.role?.replace(/_/g, ' '), icon: '👤', desc: 'assigned' },
    { title: 'Status', value: user.offboarded ? 'Offboarded' : 'Active', icon: user.offboarded ? '🔴' : '🟢',
      desc: 'account', accent: user.offboarded ? 'text-red-400' : 'text-emerald-400' },
    { title: 'MFA', value: user.mfaEnabled ? 'Enabled' : 'Not set', icon: '🔐', desc: 'protection',
      accent: user.mfaEnabled ? 'text-emerald-400' : 'text-zinc-400' },
    { title: 'Mode', value: user.mode, icon: '⚙️', desc: 'mode' },
    { title: 'Language', value: user.languagePreference?.toUpperCase() || 'EN', icon: '🌐', desc: 'preference' },
  ];

  const isAuditor = user.role === 'auditor';

  return (
    <div className="space-y-8">
      <FadeIn>
        <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
        <p className="text-zinc-400 mt-1">
          {org ? `Welcome to ${org.name || 'your organization'}` : 'Welcome back'}
        </p>
      </FadeIn>

      {org && !isAuditor && (
        <FadeIn delay={0.05}>
          <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : ''} gap-4`}>
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Plan</p>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {planLabel}
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                Quota: <span className={`capitalize ${org.tokenQuotaStatus === 'healthy' ? 'text-emerald-400' : org.tokenQuotaStatus === 'low' ? 'text-amber-400' : 'text-red-400'}`}>{org.tokenQuotaStatus}</span>
              </p>
            </div>
            {isAdmin && (
              <>
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                  <p className="text-zinc-400 text-sm">Devices</p>
                  <p className="text-2xl font-bold text-white">{stats.devices}</p>
                  <p className="text-zinc-500 text-xs mt-1">registered</p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                  <p className="text-zinc-400 text-sm">Users</p>
                  <p className="text-2xl font-bold text-white">{stats.users}</p>
                  <p className="text-zinc-500 text-xs mt-1">in organization</p>
                </div>
              </>
            )}
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCards.map((card, i) => (
          <GlowCard key={card.title} delay={0.05 + i * 0.04}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <span className="text-2xl" role="img" aria-hidden="true">{card.icon}</span>
            </div>
            <p className={`font-medium text-sm capitalize ${card.accent || 'text-emerald-400'} ${card.mono ? 'font-mono lowercase text-xs' : ''}`}>
              {card.value}
            </p>
            <p className="text-zinc-500 text-xs mt-1">{card.desc}</p>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
