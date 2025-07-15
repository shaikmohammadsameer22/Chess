import User from "../models/user.model.js";

// controllers/user.controller.js
export const getTopPlayers = async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ rating: -1 })
      .limit(10)
      .select("username rating -_id");

    res.json(topUsers);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
