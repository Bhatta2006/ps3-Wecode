export const rsiConfig = {
  name: "RSI (Relative Strength Index)",
  type: "Momentum Oscillator",

  description:
    "The Relative Strength Index (RSI) is a widely used momentum oscillator that helps traders understand whether an asset is becoming overbought or oversold. Instead of predicting price direction directly, RSI focuses on measuring the strength of recent price movements.",

  timeframe: {
    primary: "5m",
    secondary: "15m",
  },

  suitableFor: [
    "Identifying overbought and oversold conditions",
    "Timing entries in range-bound markets",
    "Confirming momentum during pullbacks",
  ],

  riskProfile: {
    riskLevel: "Medium",
    reason:
      "RSI can remain overbought or oversold for extended periods during strong trends, which may lead to premature entries if used without additional confirmation.",
  },

  notes:
    "RSI is best treated as a decision-support tool rather than a standalone strategy. Combining RSI with trend direction, price structure, or support and resistance significantly improves its reliability.",
};
