import rangeImg from "../../assets/rsi/rsi-range.png";
import trendPullbackImg from "../../assets/rsi/rsi-trend-pullback.png";

export const rsiVisuals = [
  {
    title: "RSI in Range-Bound Markets",
    image: rangeImg,
    description:
      "In sideways markets, RSI often oscillates between overbought and oversold levels, making it useful for timing mean reversion trades near range extremes.",
  },
  {
    title: "RSI Pullbacks in Trending Markets",
    image: trendPullbackImg,
    description:
      "During strong trends, RSI rarely returns to oversold levels. Pullbacks toward the 40–50 zone often indicate trend continuation rather than reversal.",
  },
];
