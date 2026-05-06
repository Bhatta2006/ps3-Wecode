import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, TrendingUp, TrendingDown, Clock, BarChart2, LogIn } from 'lucide-react';
import { api } from '../api/backtest';
import { useAuth } from '../context/AuthContext';

const STRATEGY_COLORS = {
  mean_reversion: '#ec4899',
  rs_momentum: '#f97316',
  macd_trend: '#3b82f6',
  rsi_extremes: '#a855f7',
  bollinger_bands: '#06b6d4',
  ichimoku: '#84cc16',
  pairs_trading: '#22d3ee',
  triple_ema: '#f59e0b',
  opening_range_breakout: '#ef4444',
  volume_momentum: '#8b5cf6',
  benchmark: '#64748b',
};

function HistoryCard({ run, index }) {
  const color = STRATEGY_COLORS[run.strategy_id] || '#6366f1';
  const returnPct = ((run.final_capital - run.initial_capital) / run.initial_capital * 100).toFixed(2);
  const isPositive = parseFloat(returnPct) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-white/8 p-5 hover:border-white/15 transition-all group"
      style={{ background: '#111118' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
          <div>
            <h3 className="text-sm font-semibold text-white">{run.strategy_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{run.universe} · {run.start_date} → {run.end_date}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : ''}{returnPct}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Capital</p>
          <p className="text-xs font-medium text-white">₹{run.initial_capital.toLocaleString('en-IN')} → ₹{run.final_capital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sharpe</p>
          <p className={`text-xs font-medium ${run.sharpe_ratio > 1 ? 'text-emerald-400' : run.sharpe_ratio > 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {run.sharpe_ratio?.toFixed(3) ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Max DD</p>
          <p className="text-xs font-medium text-red-400">{(run.max_drawdown * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
        <Clock size={11} className="text-gray-600" />
        <p className="text-[10px] text-gray-600">{new Date(run.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
    </motion.div>
  );
}

export default function History() {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.getHistory()
      .then(setRuns)
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#08080f' }}>
        <BarChart2 size={48} className="text-indigo-400 opacity-50" />
        <h2 className="text-xl font-semibold text-white">Sign in to view your history</h2>
        <p className="text-gray-500 text-sm">Every backtest you run will be saved automatically for you.</p>
        <div className="flex gap-3 mt-2">
          <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            <LogIn size={14} /> Sign In
          </Link>
          <Link to="/signup" className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:border-white/20 transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#08080f' }}>
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <HistoryIcon size={22} className="text-indigo-400" />
              <h1 className="text-3xl font-bold text-white">My History</h1>
            </div>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">{runs.length} runs saved</span>
          </div>
          <p className="text-gray-400 mb-10">Every backtest you run while logged in is saved here automatically.</p>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/5 p-5 h-40 animate-pulse" style={{ background: '#111118' }} />
              ))}
            </div>
          )}

          {!loading && runs.length === 0 && (
            <div className="text-center py-24 text-gray-500">
              <BarChart2 size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-base">No backtests saved yet.</p>
              <p className="text-sm mt-1">Run any strategy while logged in to see your results here.</p>
              <Link to="/compare" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors">
                Go to Compare →
              </Link>
            </div>
          )}

          <AnimatePresence>
            {!loading && runs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runs.map((run, i) => <HistoryCard key={run.id} run={run} index={i} />)}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
