import { Link } from "react-router-dom";

function StrategyCTA({ config }) {
  return (
    <section className="py-16 bg-black text-white text-center rounded-lg">
      <h2 className="text-3xl font-bold mb-4">
        Ready to Test This Strategy?
      </h2>

      <p className="text-gray-300 mb-6">
        Apply {config.name} on historical data and compare it
        against benchmarks.
      </p>

      <Link
        to={`/test?strategy=${config.id}`}
        className="inline-block px-6 py-3 bg-white text-black rounded-md hover:bg-gray-200 transition"
      >
        Test Strategy
      </Link>
    </section>
  );
}

export default StrategyCTA;
