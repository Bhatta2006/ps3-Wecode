function StrategyHero({ hero }) {
    return (
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {hero.title}
        </h1>
  
        <p className="text-xl text-gray-600 mb-2">
          {hero.subtitle}
        </p>
  
        <p className="text-gray-500">
          {hero.tagline}
        </p>
      </section>
    );
  }
  
  export default StrategyHero;
  