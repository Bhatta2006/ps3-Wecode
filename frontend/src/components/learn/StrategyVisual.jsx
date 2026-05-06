function StrategyVisual({ visuals }) {
  if (!visuals || visuals.length === 0) return null;

  return (
    <section className="mb-20">
      <h2 className="text-2xl font-semibold mb-10">
        Visual Explanation
      </h2>

      <div className="space-y-20">
        {visuals.map((block, index) => (
          <div key={index} className="space-y-6">
            <h3 className="text-xl font-semibold">
              {block.title}
            </h3>

            <p className="text-gray-700 max-w-3xl">
              {block.explanation}
            </p>

            <img
              src={block.image}
              alt={block.title}
              className="rounded-xl border w-full max-w-4xl"
            />

            <p className="text-sm italic text-gray-500 max-w-3xl">
              {block.takeaway}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StrategyVisual;
