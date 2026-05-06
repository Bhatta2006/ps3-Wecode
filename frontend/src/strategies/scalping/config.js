export const scalpingConfig = {
  name: "Scalping",
  type: "Short-Term",

  description:
    "Scalping focuses on capturing small price movements through quick entries and exits. It relies heavily on execution speed, discipline, and market liquidity.",

  timeframe: {
    primary: "1m",
    secondary: "5m",
  },

  suitableFor: [
    "Highly liquid instruments",
    "Intraday traders",
    "Traders comfortable with fast decision-making",
  ],

  riskProfile: {
    riskLevel: "High",
    reason:
      "Frequent trading and tight stop losses mean small mistakes can accumulate quickly if discipline is lost.",
  },

  notes:
    "Scalping requires focus and fast execution. It is not recommended for traders who prefer slower decision-making.",
};
