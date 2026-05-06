export const momentumContent = {
  id: "momentum",

  /* ============================
     1. HERO
  ============================ */
  hero: {
    title: "Momentum Trading Strategy",
    shortDescription:
      "Momentum trading is a strategy that aims to profit from strong and sustained price movements by trading in the direction of the prevailing trend.",
  },

  /* ============================
     2. OVERVIEW
  ============================ */
  overview: {
    description:
      "Momentum trading is based on the idea that assets which are moving strongly in one direction tend to continue moving in that direction for a period of time.",

    intuition:
      "Instead of predicting reversals, momentum traders align themselves with strength. The goal is simple: join the move once momentum is confirmed and exit when it weakens.",

    technicalConcept:
      "Momentum traders often rely on indicators such as moving averages, RSI, and volume to confirm trend strength and continuation.",

    learningNote:
      "Momentum trading is not about catching tops or bottoms — it is about staying with the trend while it lasts.",
  },

  /* ============================
     3. VISUAL EXPLANATION
  ============================ */
  visualExplanation: {
    intro:
      "The charts below demonstrate how momentum traders identify strong trends and participate during continuation phases.",

    keyIdea:
      "Strong trends tend to persist longer than expected, providing multiple trading opportunities.",
  },

  /* ============================
     4. TRADING RULES
  ============================ */
  rules: {
    explanation:
      "Momentum rules focus on clarity and confirmation. Trades are taken only when strength is clearly visible.",

    entry: [
      "Identify a clear uptrend or downtrend",
      "Confirm momentum using indicators like RSI or moving averages",
      "Enter after a pullback or breakout in the trend direction",
      "Ensure volume supports the move",
    ],

    exitExplanation:
      "Exits are designed to protect profits when momentum begins to fade.",

    exit: [
      "Exit when momentum indicators weaken",
      "Use trailing stop-loss to lock profits",
      "Exit on clear trend reversal signals",
    ],
  },

  /* ============================
     5. PARAMETERS
  ============================ */
  parameters: [
    {
      name: "Trend Indicator",
      description:
        "Used to identify the direction and strength of the trend.",
      learningTip:
        "Moving averages help filter noise and highlight trend direction.",
    },
    {
      name: "Momentum Indicator",
      description:
        "Measures the speed and strength of price movement.",
      learningTip:
        "RSI and MACD are commonly used to confirm momentum.",
    },
    {
      name: "Trailing Stop",
      description:
        "A dynamic stop-loss that moves with price.",
      learningTip:
        "Trailing stops help protect gains during strong trends.",
    },
  ],

  /* ============================
     6. MARKET CONDITIONS
  ============================ */
  conditions: {
    explanation:
      "Momentum strategies perform best in clearly trending markets.",

    worksWell: [
      "Strong trending conditions",
      "High participation and volume",
      "Breakout phases",
    ],

    failsWhen: [
      "Sideways or choppy markets",
      "Low volatility environments",
      "False breakouts",
    ],

    learningNote:
      "Momentum traders often avoid range-bound markets.",
  },

  /* ============================
     7. RISKS
  ============================ */
  risks: {
    explanation:
      "Momentum trading can be vulnerable to sudden reversals.",

    points: [
      "Late entries near trend exhaustion",
      "Sharp pullbacks",
      "False momentum signals",
    ],

    takeaway:
      "Successful momentum trading balances patience with decisive exits.",
  },

  /* ============================
     8. CTA
  ============================ */
  cta: {
    buttonText: "Test Momentum Strategy on Historical Data",
  },
};
