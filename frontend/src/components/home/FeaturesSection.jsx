function FeaturesSection() {
    const features = [
      {
        title: "Strategy Learning",
        description:
          "Clear, plain-English explanations of trading strategies with visual intuition."
      },
      {
        title: "Historical Backtesting",
        description:
          "Test strategies on real market data across different time periods."
      },
      {
        title: "Performance Metrics",
        description:
          "Analyze returns, drawdowns, and risk metrics to evaluate strategies objectively."
      },
      {
        title: "Visual Analysis",
        description:
          "Interactive charts showing price action, trades, and equity curves."
      }
    ];
  
    return (
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Key Features
          </h2>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="border rounded-lg p-6 hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  export default FeaturesSection;
  