import { motion } from 'framer-motion';

export default function GlowCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, borderColor: 'rgba(16, 185, 129, 0.3)' }}
      className={`relative p-6 bg-zinc-900 rounded-2xl border border-zinc-800 transition-colors overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div
          className="absolute -inset-1 rounded-2xl blur-xl opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.3), transparent 70%)' }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
