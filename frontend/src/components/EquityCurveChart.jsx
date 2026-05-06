import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 p-3 text-sm"
      style={{ background: '#1a1a24', fontFamily: 'Inter, sans-serif' }}>
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-semibold text-white">₹{Number(entry.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

export default function EquityCurveChart({ chartData, strategyColor, strategyName, showMacroFiltered = false }) {
  if (!chartData?.length) return null;

  // Thin out data for performance (max 200 points)
  const step = Math.max(1, Math.floor(chartData.length / 200));
  const data = chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);

  const MACRO_COLOR = '#a78bfa'; // purple for macro-filtered line

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={strategyColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strategyColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6b7280" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="macroGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={MACRO_COLOR} stopOpacity={0.25} />
              <stop offset="95%" stopColor={MACRO_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            tickFormatter={v => v.slice(0, 7)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingTop: 12 }}
            formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
          />

          {/* Benchmark */}
          <Area
            type="monotone"
            dataKey="benchmark"
            name="Benchmark (Buy & Hold)"
            stroke="#4b5563"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            fill="url(#benchmarkGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#6b7280' }}
          />

          {/* Raw Strategy */}
          <Area
            type="monotone"
            dataKey="strategy"
            name={strategyName}
            stroke={strategyColor}
            strokeWidth={2.5}
            fill="url(#strategyGrad)"
            dot={false}
            activeDot={{ r: 5, fill: strategyColor, stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Macro-Filtered Strategy (only when macro filter was on) */}
          {showMacroFiltered && (
            <Area
              type="monotone"
              dataKey="macro_filtered"
              name={`${strategyName} (Macro-Filtered)`}
              stroke={MACRO_COLOR}
              strokeWidth={2}
              strokeDasharray="4 2"
              fill="url(#macroGrad)"
              dot={false}
              activeDot={{ r: 5, fill: MACRO_COLOR, stroke: '#fff', strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
