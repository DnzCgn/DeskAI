import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import FadeIn from '../components/FadeIn';
import GlowCard from '../components/GlowCard';
import RequireRole from '../components/RequireRole';

const COLOR_MAP = {
  zinc: 'border-zinc-700/50 bg-zinc-900/50 text-zinc-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
  purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
};

const BUTTON_MAP = {
  emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  blue: 'bg-blue-600 hover:bg-blue-500 text-white',
  purple: 'bg-purple-600 hover:bg-purple-500 text-white',
};

export default function Billing() {
  return (
    <RequireRole roles={['owner', 'company_admin']}>
      <BillingContent />
    </RequireRole>
  );
}

function BillingContent() {
  const [org, setOrg] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/org').then(({ data }) => data.org),
      api.get('/plans').then(({ data }) => data.plans),
    ])
      .then(([orgData, plansData]) => {
        setOrg(orgData);
        setPlans(plansData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planId) {
    setError('');
    setCheckingOut(planId);
    try {
      const base = window.location.origin;
      const { data } = await api.post('/stripe/checkout', {
        plan: planId,
        successUrl: `${base}/billing/success`,
        cancelUrl: `${base}/billing/cancel`,
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
      setCheckingOut(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = org?.plan || 'personal_free';

  return (
    <div className="space-y-8">
      <FadeIn>
        <h2 className="text-2xl font-semibold text-white">Billing</h2>
        <p className="text-zinc-400 mt-1">Manage your subscription plan</p>
      </FadeIn>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlan;
          const accent = COLOR_MAP[plan.color];

          return (
            <FadeIn key={plan.id} delay={0.05 * i}>
              <GlowCard delay={0.05 * i} className={`flex flex-col h-full ${plan.highlight ? 'ring-1 ring-emerald-500/30' : ''}`}>
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold rounded-full bg-emerald-500 text-white">
                    Popular
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-5">
                  <span className={`text-3xl font-bold ${plan.color === 'zinc' ? 'text-zinc-300' : `text-${plan.color}-400`}`}>
                    {plan.price}
                  </span>
                  {plan.interval && (
                    <span className="text-zinc-500 text-sm ml-1">{plan.interval}</span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className={`px-4 py-2.5 text-center text-sm font-medium rounded-xl border ${accent}`}>
                    Current plan
                  </div>
                ) : plan.id === 'personal_free' ? (
                  <div className="px-4 py-2.5 text-center text-sm text-zinc-600 font-medium rounded-xl border border-zinc-800">
                    —
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={checkingOut === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${BUTTON_MAP[plan.color] || 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}
                  >
                    {checkingOut === plan.id ? 'Redirecting...' : currentPlan === 'personal_free' ? 'Upgrade' : 'Switch'}
                  </motion.button>
                )}
              </GlowCard>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
