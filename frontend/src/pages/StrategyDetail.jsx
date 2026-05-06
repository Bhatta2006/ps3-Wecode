import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { getStrategy } from '../data/strategies';
import { api } from '../api/backtest';
import BacktestPanel from '../components/BacktestPanel';
import EquityCurveChart from '../components/EquityCurveChart';
import MetricsRow from '../components/MetricsRow';
import TradeLogTable from '../components/TradeLogTable';
import PortfolioPanel from '../components/PortfolioPanel';
import PositionSizingPanel from '../components/PositionSizingPanel';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

function InterpretationPanel({ result, strategy }) {
  if (!result) return null;
  const { metrics } = result;
  const ret = (metrics.total_return * 100).toFixed(1);
  const sharpe = metrics.sharpe_ratio.toFixed(2);
  const dd = (metrics.max_drawdown * 100).toFixed(1);
  const isGood = metrics.sharpe_ratio > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-6"
      style={{
        borderColor: `${strategy.color}30`,
        background: `${strategy.color}08`,
      }}
    >
      <div className="flex items-start gap-3">
        {isGood
          ? <CheckCircle size={20} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
          : <AlertCircle size={20} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
        }
        <div>
          <p className="text-sm font-semibold text-white mb-1">
            {isGood ? 'Strong Risk-Adjusted Performance' : 'Mixed Results — Here\'s What That Means'}
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            The <span className="text-white font-medium">{strategy.name}</span> strategy returned{' '}
            <span style={{ color: strategy.color }} className="font-semibold">{ret}%</span> over this period
            with a Sharpe ratio of <span className="text-white font-medium">{sharpe}</span>.{' '}
            {metrics.sharpe_ratio > 1
              ? `A Sharpe above 1.0 is considered good — for every unit of risk taken, you earned ${sharpe} units of return.`
              : `A Sharpe below 1.0 suggests the returns may not justify the risk taken.`
            } The maximum drawdown was <span className="text-red-400 font-medium">{dd}%</span>, meaning the portfolio fell that much from its peak at the worst point.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const strategy = getStrategy(id);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!strategy) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Strategy not found.{' '}
        <button onClick={() => navigate('/')} className="text-white underline ml-2">Go back</button>
      </div>
    );
  }

  const radarData = [
    { subject: 'Risk', value: strategy.risk.risk },
    { subject: 'Reward', value: strategy.risk.reward },
    { subject: 'Complexity', value: strategy.risk.complexity },
    { subject: 'Frequency', value: strategy.risk.frequency },
  ];

  const handleRun = async ({ universe, start, end, initialCapital, macroFilter }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.runBacktest({
        strategyId: id,
        universe,
        start,
        end,
        initialCapital,
        macroFilter,
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#08080f' }}>
      {/* Hero */}
      <div className={`relative overflow-hidden pt-24 pb-16 bg-gradient-to-b ${strategy.gradient} to-[#08080f]`}>
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: `radial-gradient(circle at 30% 50%, ${strategy.color}60 0%, transparent 60%)` }} />
        <div className="max-w-5xl mx-auto px-6 relative">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> All Strategies
          </button>

          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                    style={{ background: `${strategy.color}25`, color: strategy.color, border: `1px solid ${strategy.color}40` }}>
                {strategy.type}
              </span>
              <h1 className="text-5xl font-black text-white mb-3 leading-tight">{strategy.name}</h1>
              <p className="text-xl text-white/60 italic mb-4">"{strategy.tagline}"</p>
              <p className="text-gray-300 text-base leading-relaxed max-w-xl">{strategy.description}</p>
            </div>

            {/* Risk Radar */}
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Inter' }} />
                  <Radar dataKey="value" stroke={strategy.color} fill={strategy.color} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-gray-600 mt-1">Risk Profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* How It Works */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {strategy.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-2xl border border-white/8 bg-[#111118]"
              >
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: `${strategy.color}20`, color: strategy.color, border: `1px solid ${strategy.color}40` }}>
                  {step.step}
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">{step.title}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* The Edge */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">The Market Edge</h2>
          <div className="p-6 rounded-2xl border border-white/8 bg-[#111118]">
            <div className="flex items-start gap-3">
              <ChevronRight size={20} className="mt-0.5 shrink-0" style={{ color: strategy.color }} />
              <p className="text-gray-300 leading-relaxed">{strategy.edge}</p>
            </div>
          </div>
        </section>

        {/* Backtest */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Run the Backtest</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <BacktestPanel onRun={handleRun} loading={loading} strategyColor={strategy.color} />
            </div>

            <div className="lg:col-span-3 flex items-center justify-center min-h-[200px]">
              {!result && !loading && !error && (
                <div className="text-center text-gray-600">
                  <div className="text-5xl mb-3">📈</div>
                  <p className="text-sm">Configure and run the backtest to see results</p>
                </div>
              )}
              {loading && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-white/10 animate-spin mx-auto mb-4"
                       style={{ borderTopColor: strategy.color }} />
                  <p className="text-sm text-gray-400">Fetching market data & running simulation...</p>
                </div>
              )}
              {error && (
                <div className="text-center text-red-400">
                  <AlertCircle size={32} className="mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                  <p className="text-xs text-gray-600 mt-1">Make sure the backend is running at port 8000</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Results</h2>

              {/* Metrics */}
              <div className="mb-6">
                <MetricsRow metrics={result.metrics} strategyColor={strategy.color} />
              </div>

              {/* Macro-filtered metrics (shown only when macro filter was on) */}
              {result.macro_filter_on && result.filtered_metrics && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#a78bfa' }} />
                    <p className="text-sm font-semibold text-purple-300">Macro-Filtered Strategy Metrics</p>
                  </div>
                  <MetricsRow metrics={result.filtered_metrics} strategyColor="#a78bfa" />
                </div>
              )}

              {/* Chart */}
              <div className="rounded-2xl border border-white/8 bg-[#111118] p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Equity Curve — {strategy.name} vs Buy & Hold
                  {result.macro_filter_on && <span className="ml-2 text-purple-400">(+ Macro Filtered)</span>}
                </h3>
                <EquityCurveChart
                  chartData={result.chart_data}
                  strategyColor={strategy.color}
                  strategyName={strategy.name}
                  showMacroFiltered={result.macro_filter_on}
                />
              </div>

              {/* Portfolio State — Issue 5 */}
              {result.portfolio_state && result.portfolio_state.initial_capital && (
                <div className="mb-6">
                  <PortfolioPanel
                    portfolioState={result.portfolio_state}
                    strategyColor={strategy.color}
                  />
                </div>
              )}

              {/* Position Sizing — Issue 9 */}
              {result.position_sizing && result.position_sizing.method && (
                <div className="mb-6">
                  <PositionSizingPanel
                    positionSizing={result.position_sizing}
                    strategyColor={strategy.color}
                  />
                </div>
              )}

              {/* Trade Logs — Issue 14 */}
              {result.trade_logs && result.trade_logs.length > 0 && (
                <div className="mb-6">
                  <TradeLogTable tradeLogs={result.trade_logs} strategyColor={strategy.color} />
                </div>
              )}

              {/* Execution Time — Issue 17 */}
              {result.execution_time_ms && (
                <p className="text-xs text-gray-600 text-right mb-4">
                  Simulation completed in {result.execution_time_ms}ms
                </p>
              )}

              {/* Interpretation */}
              <InterpretationPanel result={result} strategy={strategy} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
