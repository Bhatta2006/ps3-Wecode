function StrategyConditions({ conditions }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4">
        Market Conditions
      </h2>

      <h3 className="font-semibold mb-2">Works Well In</h3>
      <ul className="list-disc ml-6 mb-4">
        {conditions.worksWell.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <h3 className="font-semibold mb-2">Fails When</h3>
      <ul className="list-disc ml-6">
        {conditions.failsWhen.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </section>
  );
}

export default StrategyConditions;
