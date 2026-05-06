import { useState } from "react";

function MeanReversionInputs({ onRunTest }) {
  // Backtest settings
  const [startDate, setStartDate] = useState("2014-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [capital, setCapital] = useState(100000);

  // Market universe
  const [market, setMarket] = useState("NIFTY50");
  const [topN, setTopN] = useState(10);

  // Strategy parameters
  const [lookback, setLookback] = useState(1);
  const [threshold, setThreshold] = useState(0); // 0 = disabled

  // Benchmark
  const [benchmark, setBenchmark] = useState("NIFTY50");

  const handleSubmit = () => {
    // Send ONLY configuration to backend
    onRunTest({
      strategy: "mean_reversion",
      startDate,
      endDate,
      capital,
      market,
      topN,
      lookback,
      threshold,
      benchmark,
    });
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Mean Reversion Strategy Inputs
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        This strategy buys the <b>top N biggest losers</b> from the selected
        market index at the close of each day and sells them at the close of
        the following trading session.
      </p>

      {/* BACKTEST SETTINGS */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Backtest Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Initial Capital (₹)
          </label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
          />
        </div>
      </div>

      {/* MARKET UNIVERSE */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Market Universe</h3>

        <label className="block text-sm font-medium mb-1">Market Index</label>
        <select
          className="w-full border rounded px-3 py-2 mb-3"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
        >
          <option value="NIFTY50">NIFTY 50</option>
          <option value="SENSEX">SENSEX</option>
        </select>

        <label className="block text-sm font-medium mb-1">
          Number of Biggest Losers (N)
        </label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
        />
        <p className="text-xs text-gray-500 mt-1">
          The strategy will buy the top N stocks with the worst daily returns.
        </p>
      </div>

      {/* STRATEGY PARAMETERS */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Strategy Parameters (Advanced)</h3>

        <label className="block text-sm font-medium mb-1">
          Lookback Period (days)
        </label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2 mb-3"
          value={lookback}
          onChange={(e) => setLookback(Number(e.target.value))}
        />
        <p className="text-xs text-gray-500 mb-3">
          Default is 1 day (matches classic mean reversion setup).
        </p>

        <label className="block text-sm font-medium mb-1">
          Deviation Threshold (σ)
        </label>
        <input
          type="number"
          step="0.1"
          className="w-full border rounded px-3 py-2"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional. Set to 0 to disable deviation filtering.
        </p>
      </div>

      {/* BENCHMARK */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Benchmark Comparison</h3>

        <label className="block text-sm font-medium mb-1">
          Benchmark Index
        </label>
        <select
          className="w-full border rounded px-3 py-2"
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value)}
        >
          <option value="NIFTY50">NIFTY 50</option>
          <option value="SENSEX">SENSEX</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
      >
        Run Mean Reversion Backtest
      </button>
    </div>
  );
}

export default MeanReversionInputs;
