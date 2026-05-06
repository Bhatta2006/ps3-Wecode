function StrategyParameters({ parameters }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4">
        Key Parameters
      </h2>

      <ul className="space-y-2">
        {parameters.map((p, i) => (
          <li key={i}>
            <strong>{p.name}:</strong> {p.description}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default StrategyParameters;
