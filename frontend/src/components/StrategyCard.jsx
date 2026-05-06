import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Activity, Gauge, Zap, Layers, GitCompare, Waves, Crosshair, BarChart2 } from 'lucide-react';

const ICONS = { TrendingUp, TrendingDown, Activity, Gauge, Zap, Layers, GitCompare, Waves, Crosshair, BarChart2 };

const TYPE_BADGE_COLORS = {
  'Mean Reversion':       'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Momentum':             'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Trend Following':      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Volatility Breakout':  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Complex Trend':        'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Statistical Arbitrage':'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Breakout':             'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export default function StrategyCard({ strategy, index }) {
  const navigate = useNavigate();
  const Icon = ICONS[strategy.icon] || TrendingUp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={() => navigate(`/strategy/${strategy.id}`)}
      className="group relative cursor-pointer rounded-2xl overflow-hidden border border-white/8 bg-[#111118] transition-all duration-300"
      style={{ boxShadow: 'none' }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 40px ${strategy.color}28, 0 20px 60px rgba(0,0,0,0.5)`;
        e.currentTarget.style.borderColor = `${strategy.color}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      {/* Gradient top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${strategy.gradient}`} />

      {/* Card content */}
      <div className="p-6">
        {/* Icon + Type */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ background: `${strategy.color}18`, border: `1px solid ${strategy.color}30` }}>
            <Icon size={22} style={{ color: strategy.color }} />
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TYPE_BADGE_COLORS[strategy.type] || 'bg-white/10 text-white/60'}`}>
            {strategy.type}
          </span>
        </div>

        {/* Name + tagline */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-white transition-colors">
          {strategy.name}
        </h3>
        <p className="text-sm text-gray-500 italic mb-3">"{strategy.tagline}"</p>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
          {strategy.description}
        </p>

        {/* Explore button */}
        <div className="mt-5 flex items-center gap-1.5 text-sm font-medium transition-all duration-200 opacity-60 group-hover:opacity-100"
             style={{ color: strategy.color }}>
          Explore Strategy
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
}
