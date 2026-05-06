export const rsiContent = {
  id: "rsi",

  /* ============================
     1. HERO
  ============================ */
  hero: {
    title: "Relative Strength Index (RSI)",
    shortDescription:
      "RSI helps traders understand whether price is gaining strength or losing momentum by measuring how aggressively buyers or sellers have been pushing the market.",
  },

  /* ============================
     2. OVERVIEW
  ============================ */
  overview: {
    description:
      "The Relative Strength Index (RSI) is a momentum oscillator that compares the magnitude of recent gains to recent losses. Instead of focusing on price direction alone, RSI focuses on the strength behind price movements.",

    intuition:
      "Markets move because of pressure. RSI is a way of measuring that pressure. When buying pressure dominates, RSI rises. When selling pressure dominates, RSI falls. The indicator does not predict reversals — it helps identify when price movement may be becoming stretched.",

    technicalConcept:
      "RSI oscillates between 0 and 100. Traditionally, values above 70 are considered overbought, while values below 30 are considered oversold. However, these levels behave differently depending on market conditions.",

    learningNote:
      "A common beginner mistake is treating overbought as a signal to sell and oversold as a signal to buy. In strong trends, RSI can remain extreme for a long time.",
  },

  /* ============================
     3. VISUAL EXPLANATION
  ============================ */
  visualExplanation: {
    intro:
      "Visualizing RSI alongside price helps reveal how momentum expands and contracts during different market phases.",

    keyIdea:
      "RSI extremes often reflect momentum strength rather than immediate reversal points.",
  },

  /* ============================
     4. TRADING RULES
  ============================ */
  rules: {
    explanation:
      "RSI-based rules focus on context rather than fixed numbers. Traders use RSI differently in ranging and trending markets.",

    entry: [
      "In range-bound markets, look for RSI near 30 or 70 combined with price rejection",
      "In uptrends, use RSI pullbacks toward 40–50 as potential continuation entries",
      "Confirm RSI signals with price structure or support and resistance",
    ],

    exitExplanation:
      "RSI exits aim to protect profits once momentum begins to fade rather than waiting for extreme levels.",

    exit: [
      "Exit when RSI shows clear momentum divergence",
      "Reduce exposure when RSI fails to make new highs in an uptrend",
      "Exit trades when price breaks key structure, even if RSI remains strong",
    ],
  },

  /* ============================
     5. PARAMETERS
  ============================ */
  parameters: [
    {
      name: "RSI Period",
      description:
        "Defines how many candles are used to calculate momentum.",
      learningTip:
        "The default period is 14. Shorter periods react faster but produce more noise.",
    },
    {
      name: "Overbought / Oversold Levels",
      description:
        "Thresholds used to identify extreme momentum conditions.",
      learningTip:
        "Adjust levels based on market behavior rather than using fixed values blindly.",
    },
  ],

  /* ============================
     6. MARKET CONDITIONS
  ============================ */
  conditions: {
    explanation:
      "RSI behaves very differently depending on whether the market is trending or ranging.",

    worksWell: [
      "Sideways or range-bound markets",
      "Pullbacks within healthy trends",
      "Momentum confirmation near key levels",
    ],

    failsWhen: [
      "Strong one-directional trends without pullbacks",
      "Low-liquidity environments",
      "News-driven volatility spikes",
    ],

    learningNote:
      "RSI should always be interpreted in the context of market structure.",
  },

  /* ============================
     7. RISKS
  ============================ */
  risks: {
    explanation:
      "RSI signals can appear early and remain valid for long periods before price reacts.",

    points: [
      "Entering too early against strong trends",
      "Ignoring price action in favor of indicator signals",
      "Over-optimizing RSI parameters",
    ],

    takeaway:
      "RSI is most effective when used as a confirmation tool rather than a standalone trigger.",
  },

  /* ============================
     8. CTA
  ============================ */
  cta: {
    buttonText: "Explore RSI Behavior on Historical Charts",
  },
};
