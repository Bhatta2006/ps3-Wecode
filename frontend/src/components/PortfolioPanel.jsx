import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowRight, Activity, XCircle, BarChart3 } from 'lucide-react';

function StatCard({ label, value, subtext, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex-1 min-w-[160px] rounded-xl p-4 border border-white/8 bg-[#0d0d15]"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color }} />
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-xl font-bold text-white mb-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {subtext && <p className="text-[11px] text-gray-500">{subtext}</p>}
    </motion.div>
  );
}

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 220;
  const height = 40;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-80">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

export default function PortfolioPanel({ portfolioState, strategyColor }) {
  if (!portfolioState || !portfolioState.initial_capital) return null;

  const ps = portfolioState;
  const isProfit = ps.total_pnl >= 0;
  const pnlColor = isProfit ? '#10b981' : '#f43f5e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-[#111118] p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Wallet size={18} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Portfolio State
        </h3>
        <span className="ml-auto text-[10px] text-gray-600 font-medium uppercase tracking-wider">Issue 5</span>
      </div>

      {/* Main Stats Row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <StatCard
          label="Initial Capital"
          value={`₹${ps.initial_capital.toLocaleString('en-IN')}`}
          subtext="Starting balance"
          icon={Wallet}
          color="#6366f1"
          delay={0}
        />
        <StatCard
          label="Final Value"
          value={`₹${ps.final_capital.toLocaleString('en-IN')}`}
          subtext={`${isProfit ? '+' : ''}${ps.total_pnl_pct}%`}
          icon={isProfit ? TrendingUp : TrendingDown}
          color={pnlColor}
          delay={0.05}
        />
        <StatCard
          label="P&L"
          value={
            <span style={{ color: pnlColor }}>
              {isProfit ? '+' : ''}₹{Math.abs(ps.total_pnl).toLocaleString('en-IN')}
            </span>
          }
          subtext={`${isProfit ? 'Profit' : 'Loss'} (${isProfit ? '+' : ''}${ps.total_pnl_pct}%)`}
          icon={Activity}
          color={pnlColor}
          delay={0.1}
        />
      </div>

      {/* Trade Activity Row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <StatCard
          label="Trade Executions"
          value={ps.total_trades}
          subtext="Buy signals acted on"
          icon={BarChart3}
          color="#10b981"
          delay={0.15}
        />
        <StatCard
          label="Hold Days"
          value={ps.hold_days}
          subtext="No signal / holding position"
          icon={ArrowRight}
          color="#6b7280"
          delay={0.2}
        />
        <StatCard
          label="Skipped Trades"
          value={ps.skip_days}
          subtext="Insufficient capital / constraints"
          icon={XCircle}
          color="#f59e0b"
          delay={0.25}
        />
      </div>

      {/* Daily Value Sparkline */}
      {ps.daily_values && ps.daily_values.length > 2 && (
        <div className="rounded-xl border border-white/5 bg-[#0a0a12] p-4">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">
            Capital History (Last {ps.daily_values.length} days)
          </p>
          <MiniSparkline data={ps.daily_values} color={strategyColor || '#6366f1'} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-600">{ps.daily_values[0]?.date}</span>
            <span className="text-[10px] text-gray-600">{ps.daily_values[ps.daily_values.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
