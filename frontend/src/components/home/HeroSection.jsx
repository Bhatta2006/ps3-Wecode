function HeroSection() {
    return (
      <section className="py-28 text-center max-w-6xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-6">
          TradeLab
        </h1>
  
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Learn, backtest, and compare algorithmic trading strategies
          using real historical market data.
        </p>
  
        <div className="flex justify-center gap-4">
          <a
            href="/learn"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
          >
            Explore Strategies
          </a>
  
          <a
            href="/test"
            className="px-6 py-3 border border-black rounded-md hover:bg-gray-100 transition"
          >
            Test Strategies
          </a>
        </div>
      </section>
    );
  }
  
  export default HeroSection;
  