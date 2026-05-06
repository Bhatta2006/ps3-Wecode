export const momentumConfig = {
  name: "Momentum",
  type: "Trend-Following",

  description:
    "Momentum trading focuses on capturing strong price movements by entering trades in the direction of an existing trend.",

  timeframe: {
    primary: "5m",
    secondary: "15m",
  },

  suitableFor: [
    "Trending markets",
    "Intraday & swing traders",
    "Traders who prefer riding strong moves",
  ],

  riskProfile: {
    riskLevel: "Medium to High",
    reason:
      "Late entries or sudden reversals can lead to sharp losses if risk is not managed properly.",
  },

  notes:
    "Momentum trading requires patience to wait for confirmation and discipline to exit when momentum weakens.",
};
