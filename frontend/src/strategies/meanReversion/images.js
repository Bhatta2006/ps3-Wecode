import overviewImg from "../../assets/mean-reversion/mean-reversion-overview.org.png";
import signalsImg from "../../assets/mean-reversion/mean-reversion-signals.png";
import failureImg from "../../assets/mean-reversion/mean-reversion-failure.org.jpg";

export const meanReversionVisuals = [
  {
    title: "Price Deviates From the Mean",
    explanation:
      "Prices rarely move in a straight line. When price moves too far away from its average, it often becomes statistically stretched.",
    image: overviewImg,
    takeaway:
      "Extreme deviations create potential opportunities for mean reversion trades.",
  },
  {
    title: "Mean Reversion Entry Signals",
    explanation:
      "Traders look for confirmation signals when price is far from the mean, such as oversold or overbought conditions.",
    image: signalsImg,
    takeaway:
      "Entries are taken when probability favors a return toward the average.",
  },
  {
    title: "When Mean Reversion Fails",
    explanation:
      "In strong trending markets, prices may continue moving away from the mean instead of reverting.",
    image: failureImg,
    takeaway:
      "Always combine mean reversion with risk management and trend awareness.",
  },
];
