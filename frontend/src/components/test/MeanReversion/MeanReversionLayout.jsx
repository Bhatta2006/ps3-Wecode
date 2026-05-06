import MeanReversionInputs from "./MeanReversionInputs";
import MeanReversionResults from "./MeanReversionResults";
import { useState } from "react";

function MeanReversionLayout() {
  const [results, setResults] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">
        Mean Reversion Strategy Tester
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEFT: Inputs */}
        <MeanReversionInputs onRunTest={setResults} />

        {/* RIGHT: Results */}
        <MeanReversionResults results={results} />
      </div>
    </div>
  );
}

export default MeanReversionLayout;
