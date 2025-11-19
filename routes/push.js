import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * Save or update a device push token for a user
 * POST /push/save-token { userId, token }
 */
router.post("/save-token", async (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token)
      return res.status(400).json({ success: false, message: "Missing userId or token" });

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken: token },
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (e) {
    console.log("save-token error:", e.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
