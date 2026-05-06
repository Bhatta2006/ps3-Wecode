function StrategyRules({ rules }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4">
        Trading Rules
      </h2>

      <h3 className="font-semibold mb-2">Entry Rules</h3>
      <ul className="list-disc ml-6 mb-4">
        {rules.entry.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ul>

      <h3 className="font-semibold mb-2">Exit Rules</h3>
      <ul className="list-disc ml-6">
        {rules.exit.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}

export default StrategyRules;
