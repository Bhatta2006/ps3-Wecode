import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2, Brain, TrendingUp } from 'lucide-react';

const UNIVERSES = [
  { value: 'EQUITY',      label: 'Equity',       description: 'Single equity price series' },
  { value: 'MULTI',       label: 'Multi-Asset',  description: 'Oil + Gold + Bonds portfolio' },
  { value: 'OIL',         label: 'Oil',          description: 'Oil-specific with volume & volatility' },
];

// Valid date range based on the local dataset
const DATASET_MIN = '2020-01-01';
const DATASET_MAX = '2047-05-18';

export default function BacktestPanel({ onRun, loading, strategyColor }) {
  const [universe, setUniverse]         = useState('EQUITY');
  const [start, setStart]               = useState('2022-01-01');
  const [end, setEnd]                   = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [macroFilter, setMacroFilter]   = useState(false);

  const inputClass =
    'w-full bg-[#0d0d15] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors';

  const handleRun = () => {
    onRun({ universe, start, end, initialCapital, macroFilter });
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111118] p-6 space-y-5">
      <h3 className="text-lg font-semibold text-white">Configure Backtest</h3>

      {/* Universe Selector */}
      <div>
        <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
          Universe
        </label>
        <div className="grid grid-cols-1 gap-2">
          {UNIVERSES.map((u) => (
            <button
              key={u.value}
              onClick={() => setUniverse(u.value)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200"
              style={{
                borderColor:   universe === u.value ? `${strategyColor}80` : 'rgba(255,255,255,0.08)',
                background:    universe === u.value ? `${strategyColor}15` : '#0d0d15',
              }}
            >
              <TrendingUp
                size={14}
                style={{ color: universe === u.value ? strategyColor : '#6b7280' }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: universe === u.value ? 'white' : '#9ca3af' }}
                >
                  {u.label}
                </p>
                <p className="text-xs text-gray-600">{u.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range & Capital */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={start}
            min={DATASET_MIN}
            max={DATASET_MAX}
            onChange={(e) => setStart(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            End Date
          </label>
          <input
            type="date"
            value={end}
            min={DATASET_MIN}
            max={DATASET_MAX}
            onChange={(e) => setEnd(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Capital (₹)
          </label>
          <input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className={inputClass}
            min="1000"
            step="1000"
          />
        </div>
      </div>

      {/* Macro Filter Toggle */}
      <div>
        <button
          onClick={() => setMacroFilter((v) => !v)}
          className="w-full flex items-start gap-3 p-4 rounded-xl border transition-all duration-200"
          style={{
            borderColor: macroFilter ? '#a78bfa80' : 'rgba(255,255,255,0.08)',
            background:  macroFilter ? '#a78bfa15' : '#0d0d15',
          }}
        >
          <Brain
            size={18}
            className="mt-0.5 shrink-0"
            style={{ color: macroFilter ? '#a78bfa' : '#6b7280' }}
          />
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-semibold"
                style={{ color: macroFilter ? 'white' : '#9ca3af' }}
              >
                Macro Intelligence Filter
              </p>
              {/* Toggle pill */}
              <div
                className="relative w-10 h-5 rounded-full transition-colors duration-200"
                style={{ background: macroFilter ? '#a78bfa' : 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: macroFilter ? '22px' : '2px' }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Gates trades using Inflation, Interest Rate, USD Index & Sentiment.
              Shows raw vs. macro-filtered equity curves side-by-side.
            </p>
          </div>
        </button>
      </div>

      {/* Date range hint */}
      <p className="text-xs text-gray-600 text-center">
        Dataset available: 2020-01-01 → 2047-05-18
      </p>

      {/* Run Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={loading}
        onClick={handleRun}
        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
        style={{
          background:  `linear-gradient(135deg, ${strategyColor}, ${strategyColor}cc)`,
          boxShadow:   loading ? 'none' : `0 0 30px ${strategyColor}50`,
        }}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Running Simulation...</>
        ) : (
          <><Play size={16} /> Run Backtest</>
        )}
      </motion.button>
    </div>
  );
}
