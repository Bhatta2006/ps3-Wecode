export const meanReversionConfig = {
  id: "mean-reversion",

  name: "Mean Reversion",

  description:
    "Trade temporary price deviations from historical averages.",

  route: "/learn/mean-reversion",

  status: "active", // future: "beta", "disabled"

  difficulty: "Beginner",

  tags: ["range-bound", "statistical", "mean-based"],

  learnCard: {
    title: "Mean Reversion",
    subtitle: "Buy weakness, sell strength",
    thumbnail: "mean-reversion" // key, not image path
  }
};
