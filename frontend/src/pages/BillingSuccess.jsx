import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FadeIn from '../components/FadeIn';

export default function BillingSuccess() {
  return (
    <div className="flex items-center justify-center py-20">
      <FadeIn>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">Subscription activated!</h2>
          <p className="text-zinc-400 mb-8">
            Your plan has been upgraded. It may take a moment for all features to become available.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              to="/organization"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              View organization
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
}
