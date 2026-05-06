export const scalpingContent = {
  id: "scalping",

  /* ============================
     1. HERO
  ============================ */
  hero: {
    title: "Scalping Strategy",
    shortDescription:
      "Scalping is a short-term trading style focused on capturing very small price movements through quick entries and exits, often within minutes.",
  },

  /* ============================
     2. OVERVIEW
  ============================ */
  overview: {
    description:
      "Scalping is based on the observation that markets are rarely static. Even during quiet sessions, prices constantly move up and down in small ranges. Scalpers aim to take advantage of these micro-movements rather than waiting for large trends.",

    intuition:
      "Instead of predicting where the market will go for the day, scalping focuses on what price is doing right now. The objective is simple: enter quickly, capture a small move, and exit without hesitation.",

    technicalConcept:
      "Scalpers typically use very low timeframes such as 1-minute or 5-minute charts. Because targets are small, precision and execution speed matter far more than long-term analysis.",

    learningNote:
      "Scalping is not about being right every time — it is about keeping losses small and repeating a simple process consistently.",
  },

  /* ============================
     3. VISUAL EXPLANATION
  ============================ */
  visualExplanation: {
    intro:
      "The charts below illustrate how scalping focuses on short bursts of price movement rather than extended trends.",

    keyIdea:
      "Each small move may seem insignificant on its own, but repeated consistently, these moves form the foundation of a scalping strategy.",
  },

  /* ============================
     4. TRADING RULES
  ============================ */
  rules: {
    explanation:
      "Scalping rules are designed to minimize thinking time and reduce emotional interference. Most decisions are planned before the trade is entered.",

    entry: [
      "Trade only highly liquid instruments",
      "Use low timeframes such as 1-minute or 5-minute charts",
      "Enter during periods of higher volume",
      "Look for short momentum bursts or clear price action patterns",
    ],

    exitExplanation:
      "Exits are critical in scalping. Holding a position too long often turns a small loss into a large one.",

    exit: [
      "Exit after a small predefined profit",
      "Exit immediately if momentum fades",
      "Always respect the stop-loss level",
    ],
  },

  /* ============================
     5. PARAMETERS
  ============================ */
  parameters: [
    {
      name: "Timeframe",
      description:
        "The chart interval used for analysis. Scalping typically relies on very short timeframes.",
      learningTip:
        "Lower timeframes provide more opportunities but also more noise.",
    },
    {
      name: "Stop Loss",
      description:
        "Defines the maximum loss allowed per trade.",
      learningTip:
        "Tight stop-losses protect capital but require disciplined execution.",
    },
    {
      name: "Take Profit",
      description:
        "The predefined profit target for each trade.",
      learningTip:
        "Scalping prioritizes consistency over large individual wins.",
    },
  ],

  /* ============================
     6. MARKET CONDITIONS
  ============================ */
  conditions: {
    explanation:
      "Scalping performs best when markets are active and liquid.",

    worksWell: [
      "Highly liquid instruments",
      "Active trading sessions",
      "Stable intraday volatility",
    ],

    failsWhen: [
      "Low-volume markets",
      "Wide bid-ask spreads",
      "Sudden news-driven spikes",
    ],

    learningNote:
      "Many scalpers choose to stay out of the market during major news events.",
  },

  /* ============================
     7. RISKS
  ============================ */
  risks: {
    explanation:
      "Because scalping involves frequent trades, small mistakes can accumulate quickly.",

    points: [
      "High transaction costs",
      "Mental fatigue from rapid decision-making",
      "Overtrading during low-quality setups",
    ],

    takeaway:
      "Scalping rewards focus and discipline, but even brief lapses in attention can erase gains.",
  },

  /* ============================
     8. CTA
  ============================ */
  cta: {
    buttonText: "Practice Scalping on Historical Data",
  },
};
