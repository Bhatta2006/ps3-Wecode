import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

/**
 * Issue 14: Explainable Strategy Logs — displays trade-by-trade audit trail
 * with dates, actions, rationale, indicator values, and P&L.
 */
export default function TradeLogTable({ tradeLogs = [], strategyColor }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  if (!tradeLogs || tradeLogs.length === 0) return null;

  const visible = expanded ? tradeLogs : tradeLogs.slice(0, 5);
  const paged   = expanded
    ? tradeLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : visible;
  const totalPages = Math.ceil(tradeLogs.length / PAGE_SIZE);

  const actionColor = (action) => {
    if (action === 'BUY' || action === 'LONG_SPREAD') return '#10b981';
    if (action === 'SELL' || action === 'SHORT_SPREAD') return '#f43f5e';
    if (action === 'SKIP') return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111118] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: strategyColor }} />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Trade Logs — Explainable Audit Trail
          </h3>
        </div>
        <span className="text-xs text-gray-600">{tradeLogs.length} entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-gray-500 font-medium py-2 pr-3">Date</th>
              <th className="text-left text-xs text-gray-500 font-medium py-2 pr-3">Action</th>
              <th className="text-left text-xs text-gray-500 font-medium py-2 pr-3">Assets</th>
              <th className="text-left text-xs text-gray-500 font-medium py-2 pr-3">Reason</th>
              <th className="text-right text-xs text-gray-500 font-medium py-2 pr-3">P&L</th>
              <th className="text-right text-xs text-gray-500 font-medium py-2">Capital After</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((log, i) => (
              <motion.tr
                key={`${log.date}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-white/3 hover:bg-white/3 transition-colors"
              >
                <td className="py-2 pr-3 text-gray-400 tabular-nums whitespace-nowrap">
                  {log.date}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-semibold"
                    style={{
                      color: actionColor(log.action),
                      background: `${actionColor(log.action)}15`,
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="py-2 pr-3 text-gray-400 text-xs max-w-[120px] truncate">
                  {log.num_assets > 0 ? `${log.assets.join(', ')}${log.num_assets > 5 ? ` +${log.num_assets - 5}` : ''}` : '—'}
                </td>
                <td className="py-2 pr-3 text-gray-300 text-xs max-w-[280px] truncate">
                  {log.reason}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap"
                  style={{ color: log.pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                  {log.pnl >= 0 ? '+' : ''}{log.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="py-2 text-right text-gray-300 tabular-nums whitespace-nowrap">
                  ₹{log.capital_after.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand / Paginate Controls */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <button
          onClick={() => {
            setExpanded(!expanded);
            setPage(0);
          }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Collapse' : `Show all ${tradeLogs.length} logs`}
        </button>

        {expanded && totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              disabled={page <= 0}
              onClick={() => setPage(p => p - 1)}
              className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:bg-white/5"
            >
              Prev
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:bg-white/5"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
