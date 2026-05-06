function StrategyOverview({ overview }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4">Overview</h2>

      <p className="text-gray-700 mb-3">
        {overview.description}
      </p>

      <p className="text-gray-700 mb-3">
        <strong>Intuition:</strong> {overview.intuition}
      </p>

      <p className="text-gray-700">
        <strong>Technical Concept:</strong> {overview.technicalConcept}
      </p>
    </section>
  );
}

export default StrategyOverview;
