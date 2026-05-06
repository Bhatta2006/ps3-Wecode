export const meanReversionContent = {
  id: "mean-reversion",

  /* =====================================================
     1. HERO
  ====================================================== */
  hero: {
    title: "Mean Reversion Strategy",
    shortDescription:
      "Mean Reversion is based on a simple but powerful idea: when prices move too far away from what is normal, they often find their way back.",
  },

  /* =====================================================
     2. OVERVIEW (TUTORIAL STYLE)
  ====================================================== */
  overview: {
    description:
      "To understand mean reversion, let’s first think about how prices behave in the real world. Prices do not move smoothly. They jump, overreact, pause, and correct. These movements are driven not just by information, but by human emotion — fear, greed, panic, and relief.",

    intuition:
      "Imagine a market where bad news suddenly appears. Traders rush to sell, pushing prices down aggressively. After some time, selling pressure fades, buyers step in, and price stabilizes. Mean reversion traders focus on this *cooling-off phase*, where extreme moves begin to normalize.",

    technicalConcept:
      "In practice, traders define ‘normal’ using tools like moving averages or statistical ranges. When price moves far above or below this reference level, it is considered stretched — and stretched prices tend to relax over time.",

    learningNote:
      "Mean reversion is not about predicting tops or bottoms. It is about recognizing *when price behavior becomes statistically unusual*.",
  },

  /* =====================================================
     3. VISUAL EXPLANATION (HOW TO READ THE CHARTS)
  ====================================================== */
  visualExplanation: {
    intro:
      "Before jumping into rules, it’s important to visually understand what mean reversion looks like on a chart. The following illustrations help build that intuition.",

    keyIdea:
      "Price repeatedly moves away from the average, but rarely stays there forever. Each deviation creates an opportunity — and a risk.",
  },

  /* =====================================================
     4. TRADING RULES (EXPLAINED, NOT COMMANDED)
  ====================================================== */
  rules: {
    explanation:
      "Mean reversion rules are designed to answer three questions: When is price unusually far from normal? When should we enter? And when should we step aside?",

    entry: [
      "First, identify a reference point such as a moving average",
      "Observe how far price has moved away from this reference",
      "When price becomes unusually low, traders look for long opportunities",
      "When price becomes unusually high, traders look for short opportunities",
    ],

    exitExplanation:
      "Exits are just as important as entries. The goal is not to capture the entire move, but to benefit from normalization.",

    exit: [
      "Exit as price moves back toward the average",
      "Exit if price stalls and fails to revert",
      "Exit immediately if risk limits are violated",
    ],
  },

  /* =====================================================
     5. PARAMETERS (WHY EACH ONE EXISTS)
  ====================================================== */
  parameters: [
    {
      name: "Lookback Period",
      description:
        "This defines how much past data is used to calculate the average. Short lookbacks react quickly but can be noisy. Longer lookbacks are smoother but slower to respond.",
      learningTip:
        "There is no perfect lookback — traders adjust it based on market behavior.",
    },
    {
      name: "Deviation Threshold",
      description:
        "This controls how extreme a price move must be before considering a trade.",
      learningTip:
        "Small thresholds trigger frequent trades. Larger thresholds produce fewer but stronger signals.",
    },
    {
      name: "Stop Loss",
      description:
        "This protects the trader when price continues moving away instead of reverting.",
      learningTip:
        "Mean reversion without stop-losses is one of the fastest ways to blow up an account.",
    },
  ],

  /* =====================================================
     6. MARKET CONDITIONS (WHEN TO USE IT)
  ====================================================== */
  conditions: {
    explanation:
      "Mean reversion does not work equally well in all environments. Understanding *when not to trade* is a core skill.",

    worksWell: [
      "Markets that move sideways rather than trending strongly",
      "Highly liquid assets where price distortions correct quickly",
      "Periods of stable volatility",
    ],

    failsWhen: [
      "Strong trending markets",
      "Major news or earnings releases",
      "Momentum-driven breakouts",
    ],

    learningNote:
      "Many professionals combine mean reversion with trend filters to avoid trading against strong trends.",
  },

  /* =====================================================
     7. RISKS & LIMITATIONS (HONEST DISCUSSION)
  ====================================================== */
  risks: {
    explanation:
      "Mean reversion can feel deceptively safe because it often wins many small trades. However, its losses can be sudden and severe.",

    points: [
      "Price can remain stretched longer than expected",
      "Repeated small losses during regime changes",
      "Psychological discomfort when trading against the crowd",
    ],

    takeaway:
      "Mean reversion rewards patience and discipline, but punishes overconfidence. Risk control is not optional — it is essential.",
  },

  /* =====================================================
     8. CTA
  ====================================================== */
  cta: {
    buttonText: "Practice Mean Reversion on Historical Data",
  },
};
