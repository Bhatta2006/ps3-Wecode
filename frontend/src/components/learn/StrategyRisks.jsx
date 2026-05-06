function StrategyRisks({ risks }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4">
        Risks & Limitations
      </h2>

      <ul className="list-disc ml-6 mb-4">
        {risks.points.map((risk, i) => (
          <li key={i}>{risk}</li>
        ))}
      </ul>

      <p className="text-gray-700 italic">
        {risks.takeaway}
      </p>
    </section>
  );
}

export default StrategyRisks;
