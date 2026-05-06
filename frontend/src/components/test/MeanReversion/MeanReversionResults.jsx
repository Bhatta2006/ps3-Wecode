function MeanReversionResults({ results }) {
    if (!results) {
      return (
        <div className="border rounded-lg p-6 bg-gray-50 text-gray-600">
          <h2 className="text-xl font-semibold mb-2">
            Strategy Results
          </h2>
          <p>
            Run the strategy to see performance metrics, charts,
            and interpretation of results.
          </p>
        </div>
      );
    }
  
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Backtest Results
        </h2>
  
        {/* GRAPH PLACEHOLDER */}
        <div className="h-56 bg-gray-100 rounded flex items-center justify-center mb-6">
          <span className="text-gray-500">
            📈 Equity Curve (Backend coming next)
          </span>
        </div>
  
        {/* METRICS */}
        <div className="space-y-3 text-sm">
          <p>
            <strong>Strategy Return:</strong> {results.returnPct}%
          </p>
          <p>
            <strong>{results.benchmark} Return:</strong>{" "}
            {results.benchmarkReturn}%
          </p>
          <p>
            <strong>Maximum Drawdown:</strong>{" "}
            {results.maxDrawdown}%
          </p>
        </div>
  
        {/* TEACHING EXPLANATION */}
        <div className="mt-6 text-sm text-gray-700">
          <p className="mb-2">
            In this backtest, the Mean Reversion strategy outperformed
            the selected benchmark by exploiting temporary price
            deviations.
          </p>
          <p className="mb-2">
            Notice how returns are achieved with controlled drawdowns,
            which is a typical characteristic of mean reversion systems
            in range-bound markets.
          </p>
          <p>
            In the next step, we will connect this panel to the backend
            to display real historical charts and trade-by-trade analysis.
          </p>
        </div>
      </div>
    );
  }
  
  export default MeanReversionResults;
  