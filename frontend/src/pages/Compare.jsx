import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STRATEGIES } from '../data/strategies';
import { api } from '../api/backtest';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GitCompare, Loader2, X, TrendingUp, Brain, Shield } from 'lucide-react';

const UNIVERSES = [
  { value: 'EQUITY',  label: 'Equity',      description: 'Single equity series' },
  { value: 'MULTI',   label: 'Multi-Asset',  description: 'Oil + Gold + Bonds' },
  { value: 'OIL',     label: 'Oil',          description: 'Oil with volume & volatility' },
];

const DATASET_MIN = '2020-01-01';
const DATASET_MAX = '2047-05-18';

export default function Compare() {
  const [selected, setSelected] = useState([]);
  const [universe, setUniverse] = useState('EQUITY');
  const [start, setStart] = useState('2022-01-01');
  const [end, setEnd] = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [macroFilter, setMacroFilter] = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleStrategy = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const runComparison = async () => {
    if (!selected.length) return;
    setLoading(true);
    setResults({});
    try {
      const runs = await Promise.all(
        selected.map(id => api.runBacktest({
          strategyId: id, universe, start, end, initialCapital, macroFilter
        }).then(r => ({ id, data: r })))
      );
      const map = {};
      runs.forEach(({ id, data }) => { map[id] = data; });
      setResults(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Merge chart data by date
  const mergedData = (() => {
    if (!Object.keys(results).length) return [];
    const allDates = [...new Set(Object.values(results).flatMap(r => r.chart_data.map(d => d.date)))].sort();
    return allDates.map(date => {
      const row = { date };
      Object.entries(results).forEach(([id, r]) => {
        const point = r.chart_data.find(d => d.date === date);
        if (point) {
          row[id] = point.strategy;
          row['benchmark'] = point.benchmark;
          if (point.macro_filtered) row[`${id}_filtered`] = point.macro_filtered;
        }
      });
      return row;
    });
  })();

  const inputClass = "bg-[#0d0d15] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors";

  // Helper for conditional color
  const valColor = (val, positiveIsGood = true) => {
    if (val === undefined || val === null) return 'text-gray-400';
    return (positiveIsGood ? val > 0 : val < 0) ? 'text-emerald-400' : val === 0 ? 'text-gray-400' : 'text-red-400';
  };

  return (
    <div className="min-h-screen" style={{ background: '#08080f' }}>
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <GitCompare size={24} className="text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Strategy Comparison</h1>
          </div>
          <p className="text-gray-400 mb-10">
            Select up to 5 strategies to compare risk-adjusted returns, VaR, Alpha, and Beta head-to-head.
          </p>

          {/* Strategy Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {STRATEGIES.map(s => {
              const isSelected = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStrategy(s.id)}
                  className="relative p-4 rounded-xl border text-left transition-all duration-200"
                  style={{
                    borderColor: isSelected ? `${s.color}60` : 'rgba(255,255,255,0.08)',
                    background: isSelected ? `${s.color}12` : '#111118',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    {isSelected && <X size={12} className="text-gray-400" />}
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{s.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.type}</p>
                </button>
              );
            })}
          </div>

          {/* Controls Row */}
          <div className="rounded-2xl border border-white/8 bg-[#111118] p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Universe */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Universe</label>
                <div className="flex gap-2">
                  {UNIVERSES.map(u => (
                    <button
                      key={u.value}
                      onClick={() => setUniverse(u.value)}
                      className="px-3 py-2 rounded-lg border text-xs font-medium transition-all"
                      style={{
                        borderColor: universe === u.value ? '#6366f180' : 'rgba(255,255,255,0.08)',
                        background: universe === u.value ? '#6366f115' : '#0d0d15',
                        color: universe === u.value ? 'white' : '#9ca3af',
                      }}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Start</label>
                <input type="date" value={start} onChange={e => setStart(e.target.value)}
                  className={inputClass} min={DATASET_MIN} max={DATASET_MAX} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">End</label>
                <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                  className={inputClass} min={DATASET_MIN} max={DATASET_MAX} />
              </div>

              {/* Capital */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Capital (₹)</label>
                <input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))}
                  className={inputClass} min="1000" step="1000" />
              </div>

              {/* Macro Filter Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMacroFilter(!macroFilter)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm"
                  style={{
                    borderColor: macroFilter ? '#a78bfa60' : 'rgba(255,255,255,0.08)',
                    background: macroFilter ? '#a78bfa15' : '#0d0d15',
                    color: macroFilter ? '#a78bfa' : '#6b7280',
                  }}
                >
                  <Brain size={14} />
                  Macro Filter {macroFilter ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Run Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!selected.length || loading}
                onClick={runComparison}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 transition-all text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Running...</> : <><GitCompare size={14} /> Compare</>}
              </motion.button>
            </div>
          </div>

          {/* Comparison Chart */}
          <AnimatePresence>
            {mergedData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/8 bg-[#111118] p-6 mb-8"
              >
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
                  Equity Curves — {universe} Universe
                  {macroFilter && <span className="ml-2 text-purple-400">(+ Macro Filtered)</span>}
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mergedData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false}
                        tickFormatter={v => v.slice(0, 7)} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false}
                        tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={55} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'Inter', fontSize: 12 }}
                        formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingTop: 16 }} />
                      <Line dataKey="benchmark" name="Benchmark" stroke="#4b5563" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                      {selected.map(id => {
                        const s = STRATEGIES.find(x => x.id === id);
                        return <Line key={id} dataKey={id} name={s?.name} stroke={s?.color} strokeWidth={2} dot={false} />;
                      })}
                      {/* Macro filtered lines */}
                      {macroFilter && selected.map(id => {
                        const s = STRATEGIES.find(x => x.id === id);
                        return <Line key={`${id}_f`} dataKey={`${id}_filtered`} name={`${s?.name} (Filtered)`}
                          stroke={s?.color} strokeWidth={1.5} strokeDasharray="4 3" dot={false} opacity={0.6} />;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Metrics Comparison Table */}
          {Object.keys(results).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/8 bg-[#111118] overflow-hidden mb-8">
              <div className="px-6 pt-5 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Risk-Adjusted Performance Metrics
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Strategy</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Return</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Annual</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Volatility</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Sharpe</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Max DD</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">VaR 95%</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">VaR 99%</th>
                      <th className="text-right px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Alpha</th>
                      <th className="text-right px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Beta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.map(id => {
                      const s = STRATEGIES.find(x => x.id === id);
                      const m = results[id]?.metrics;
                      if (!m) return null;
                      return (
                        <tr key={id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s?.color }} />
                              <span className="font-medium text-white">{s?.name}</span>
                            </div>
                          </td>
                          <td className={`px-3 py-4 text-right font-semibold tabular-nums ${valColor(m.total_return)}`}>
                            {(m.total_return * 100).toFixed(2)}%
                          </td>
                          <td className={`px-3 py-4 text-right tabular-nums ${valColor(m.annualized_return)}`}>
                            {(m.annualized_return * 100).toFixed(2)}%
                          </td>
                          <td className={`px-3 py-4 text-right tabular-nums ${m.annualized_volatility < 0.2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {(m.annualized_volatility * 100).toFixed(2)}%
                          </td>
                          <td className={`px-3 py-4 text-right font-semibold tabular-nums ${m.sharpe_ratio > 1 ? 'text-emerald-400' : m.sharpe_ratio > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {m.sharpe_ratio.toFixed(3)}
                          </td>
                          <td className="px-3 py-4 text-right text-red-400 tabular-nums">
                            {(m.max_drawdown * 100).toFixed(2)}%
                          </td>
                          <td className="px-3 py-4 text-right text-amber-400 tabular-nums">
                            {m.var_95_amount !== undefined ? `₹${Number(m.var_95_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                          </td>
                          <td className="px-3 py-4 text-right text-red-400 tabular-nums">
                            {m.var_99_amount !== undefined ? `₹${Number(m.var_99_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                          </td>
                          <td className={`px-3 py-4 text-right font-semibold tabular-nums ${valColor(m.alpha)}`}>
                            {m.alpha !== undefined ? `${(m.alpha * 100).toFixed(2)}%` : '—'}
                          </td>
                          <td className={`px-6 py-4 text-right tabular-nums ${m.beta !== undefined && m.beta < 1.2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {m.beta !== undefined ? m.beta.toFixed(3) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Execution Times */}
          {Object.keys(results).length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {selected.map(id => {
                const s = STRATEGIES.find(x => x.id === id);
                const r = results[id];
                if (!r) return null;
                return (
                  <span key={id} className="text-xs text-gray-600">
                    <span style={{ color: s?.color }}>{s?.name}</span>: {r.execution_time_ms}ms
                  </span>
                );
              })}
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
