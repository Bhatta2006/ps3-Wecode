export const macdConfig = {
  name: "MACD (Moving Average Convergence Divergence)",
  type: "Trend & Momentum Indicator",

  description:
    "MACD is a trend-following momentum indicator that shows the relationship between two moving averages of price. It helps traders understand when momentum is strengthening, weakening, or shifting direction.",

  timeframe: {
    primary: "15m",
    secondary: "1h",
  },

  suitableFor: [
    "Trend confirmation",
    "Momentum shifts",
    "Early trend change detection",
  ],

  riskProfile: {
    riskLevel: "Medium",
    reason:
      "MACD signals often lag price and can produce late entries if used without price structure or market context.",
  },

  notes:
    "MACD works best when used to confirm trend direction and momentum changes rather than as a standalone entry trigger.",
};
