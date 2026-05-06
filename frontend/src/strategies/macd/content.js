export const macdContent = {
  id: "macd",

  /* ============================
     1. HERO
  ============================ */
  hero: {
    title: "MACD (Moving Average Convergence Divergence)",
    shortDescription:
      "MACD helps traders understand changes in trend strength and momentum by analyzing the relationship between fast and slow moving averages.",
  },

  /* ============================
     2. OVERVIEW
  ============================ */
  overview: {
    description:
      "MACD is a momentum indicator built from moving averages. Instead of reacting to price alone, it measures how momentum evolves as trends develop, slow down, or reverse.",

    intuition:
      "Think of MACD as a conversation between two moving averages. When they move apart, momentum is increasing. When they move closer, momentum is weakening. MACD does not predict the future — it reveals changes already happening beneath price.",

    technicalConcept:
      "MACD consists of three components: the MACD line, the signal line, and the histogram. The histogram visualizes the distance between the MACD and signal line, making momentum shifts easier to observe.",

    learningNote:
      "Many traders focus only on line crossovers. In practice, the histogram often provides earlier and clearer information about momentum changes.",
  },

  /* ============================
     3. VISUAL EXPLANATION
  ============================ */
  visualExplanation: {
    intro:
      "MACD visuals help traders see momentum acceleration and deceleration before obvious price changes occur.",

    keyIdea:
      "Shrinking histogram bars often signal momentum loss before price reversals become visible.",
  },

  /* ============================
     4. TRADING RULES
  ============================ */
  rules: {
    explanation:
      "MACD rules are most effective when used for confirmation rather than prediction.",

    entry: [
      "Look for MACD alignment with the prevailing trend",
      "Use histogram expansion to confirm momentum continuation",
      "Treat line crossovers as confirmation, not entry triggers",
    ],

    exitExplanation:
      "MACD exits focus on momentum loss rather than waiting for full reversals.",

    exit: [
      "Exit when histogram starts shrinking consistently",
      "Reduce position size when MACD fails to confirm new price highs or lows",
      "Exit when price breaks key market structure even if MACD remains positive",
    ],
  },

  /* ============================
     5. PARAMETERS
  ============================ */
  parameters: [
    {
      name: "Fast EMA",
      description:
        "Represents short-term price momentum.",
      learningTip:
        "Shorter EMAs respond faster but increase noise sensitivity.",
    },
    {
      name: "Slow EMA",
      description:
        "Represents longer-term price momentum.",
      learningTip:
        "The gap between fast and slow EMAs reflects momentum strength.",
    },
    {
      name: "Signal Line",
      description:
        "A smoothed moving average of the MACD line.",
      learningTip:
        "Crossovers confirm momentum shifts rather than predict them.",
    },
  ],

  /* ============================
     6. MARKET CONDITIONS
  ============================ */
  conditions: {
    explanation:
      "MACD performs best when markets exhibit sustained directional movement.",

    worksWell: [
      "Trending markets",
      "Momentum continuation phases",
      "Higher timeframes with reduced noise",
    ],

    failsWhen: [
      "Sideways or choppy markets",
      "Low volatility conditions",
      "Rapid news-driven price spikes",
    ],

    learningNote:
      "MACD lag increases in fast, range-bound environments.",
  },

  /* ============================
     7. RISKS
  ============================ */
  risks: {
    explanation:
      "MACD reacts to price changes after they occur.",

    points: [
      "Late entries during sharp reversals",
      "False crossovers in ranging markets",
      "Overconfidence in histogram signals without price context",
    ],

    takeaway:
      "MACD is most powerful when used to confirm what price is already suggesting.",
  },

  /* ============================
     8. CTA
  ============================ */
  cta: {
    buttonText: "Analyze MACD Behavior on Historical Charts",
  },
};
