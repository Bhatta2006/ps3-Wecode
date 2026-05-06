import StrategyCard from "../components/StrategyCard";
import meanImg from "../assets/meanreversion.jpg";
import momentumImg from "../assets/momentum.jpg";
import rsiImg from "../assets/rsi.jpg";

function Test() {
  const strategies = [
    {
      title: "Mean Reversion",
      image: meanImg,
      path: "/test/mean-reversion",
    },
    {
      title: "Momentum",
      image: momentumImg,
      path: "/test/momentum",
    },
    {
      title: "RSI Strategy",
      image: rsiImg,
      path: "/test/rsi",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Test Strategies</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((s) => (
          <StrategyCard
            key={s.title}
            title={s.title}
            image={s.image}
            to={s.path}
          />
        ))}
      </div>
    </div>
  );
}

export default Test;
