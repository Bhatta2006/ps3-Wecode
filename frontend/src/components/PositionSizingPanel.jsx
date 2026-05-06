import { motion } from 'framer-motion';
import { Shield, Scale, BarChart2, AlertTriangle } from 'lucide-react';

function WeightBar({ asset, weight, volatility, color, maxWeight }) {
  const barWidth = Math.min((weight / Math.max(maxWeight, 1)) * 100, 100);
  const isAtLimit = weight >= 24.5; // near the 25% cap

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{asset}</span>
          {isAtLimit && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
              AT LIMIT
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500">
            σ = {(volatility * 100).toFixed(2)}%
          </span>
          <span className="text-sm font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {weight.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
        />
      </div>
    </div>
  );
}

export default function PositionSizingPanel({ positionSizing, strategyColor }) {
  if (!positionSizing || !positionSizing.method) return null;

  const ps = positionSizing;
  const assets = Object.keys(ps.asset_weights_pct || {});
  const maxWeight = Math.max(...Object.values(ps.asset_weights_pct || { _: 100 }));

  const methodDisplay = {
    inverse_volatility: 'Inverse-Volatility Weighting',
    equal_weight: 'Equal Weight',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-[#111118] p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Scale size={18} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Position Sizing — Risk-Aware Allocation
        </h3>
        <span className="ml-auto text-[10px] text-gray-600 font-medium uppercase tracking-wider">Issue 9</span>
      </div>

      {/* Method & Constraints */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[180px] rounded-xl p-4 border border-white/8 bg-[#0d0d15]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={14} className="text-indigo-400" />
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Sizing Method</p>
          </div>
          <p className="text-sm font-semibold text-white">
            {methodDisplay[ps.method] || ps.method}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Lower volatility → Higher allocation
          </p>
        </div>

        <div className="flex-1 min-w-[180px] rounded-xl p-4 border border-white/8 bg-[#0d0d15]">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-amber-400" />
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Position Limit</p>
          </div>
          <p className="text-sm font-semibold text-white">
            Max {ps.max_position_pct}% per asset
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Prevents overexposure to single assets
          </p>
        </div>

        <div className="flex-1 min-w-[180px] rounded-xl p-4 border border-white/8 bg-[#0d0d15]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-purple-400" />
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Rebalance</p>
          </div>
          <p className="text-sm font-semibold text-white capitalize">
            {ps.rebalance_frequency}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Portfolio re-weighted at this frequency
          </p>
        </div>
      </div>

      {/* Per-Asset Weight Bars */}
      {assets.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#0a0a12] p-4">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-4">
            Asset Allocation Weights (Inverse-Volatility)
          </p>
          {assets.map((asset, i) => (
            <WeightBar
              key={asset}
              asset={asset}
              weight={ps.asset_weights_pct[asset]}
              volatility={ps.asset_volatilities?.[asset] || 0}
              color={strategyColor || '#6366f1'}
              maxWeight={maxWeight}
            />
          ))}
          <p className="text-[10px] text-gray-600 mt-3 italic">
            σ = annualized volatility · Lower σ means calmer price action, so more capital is allocated
          </p>
        </div>
      )}

      {assets.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            No position sizing data available — run a strategy (not benchmark) to see allocation details
          </p>
        </div>
      )}
    </motion.div>
  );
}
