function CTASection() {
    return (
      <section className="py-24 bg-black text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">
            Start Exploring TradeLab
          </h2>
  
          <p className="text-gray-300 mb-8">
            Learn how trading strategies behave in real markets —
            before making real decisions.
          </p>
  
          <div className="flex justify-center gap-4">
            <a
              href="/learn"
              className="px-6 py-3 bg-white text-black rounded-md hover:bg-gray-200 transition"
            >
              Learn Strategies
            </a>
  
            <a
              href="/test"
              className="px-6 py-3 border border-white rounded-md hover:bg-gray-800 transition"
            >
              Test Strategies
            </a>
          </div>
        </div>
      </section>
    );
  }
  
  export default CTASection;
  