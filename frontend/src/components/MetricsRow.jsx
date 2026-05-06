import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const METRIC_CONFIG = {
  total_return:          { label: 'Total Return',      format: v => `${(v * 100).toFixed(2)}%`,  positive: v => v > 0 },
  annualized_return:     { label: 'Annual Return',     format: v => `${(v * 100).toFixed(2)}%`,  positive: v => v > 0 },
  annualized_volatility: { label: 'Volatility',        format: v => `${(v * 100).toFixed(2)}%`,  positive: v => v < 0.2 },
  sharpe_ratio:          { label: 'Sharpe Ratio',      format: v => v.toFixed(3),               positive: v => v > 1 },
  max_drawdown:          { label: 'Max Drawdown',      format: v => `${(v * 100).toFixed(2)}%`,  positive: v => v > -0.1 },
  var_95_amount:         { label: 'VaR 95%',           format: v => `₹${Number(v).toLocaleString('en-IN')}`, positive: v => v < 5000 },
  var_99_amount:         { label: 'VaR 99%',           format: v => `₹${Number(v).toLocaleString('en-IN')}`, positive: v => v < 10000 },
  alpha:                 { label: 'Alpha',             format: v => `${(v * 100).toFixed(2)}%`,  positive: v => v > 0 },
  beta:                  { label: 'Beta',              format: v => v.toFixed(3),               positive: v => v < 1.2 },
};

function MetricCard({ metricKey, value, strategyColor, index }) {
  const cfg = METRIC_CONFIG[metricKey];
  if (!cfg || value === undefined) return null;

  const isGood = cfg.positive(value);
  const Icon = isGood ? TrendingUp : TrendingDown;
  const iconColor = isGood ? '#10b981' : '#f43f5e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex-1 min-w-[140px] rounded-xl p-4 border border-white/8 bg-[#111118]"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{cfg.label}</p>
        <Icon size={14} color={iconColor} />
      </div>
      <p className="text-2xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {cfg.format(value)}
      </p>
    </motion.div>
  );
}

export default function MetricsRow({ metrics, strategyColor }) {
  if (!metrics) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(metrics).map(([key, value], i) => (
        <MetricCard
          key={key}
          metricKey={key}
          value={value}
          strategyColor={strategyColor}
          index={i}
        />
      ))}
    </div>
  );
}
