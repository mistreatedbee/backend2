import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

// List users (filter by role optional: /users?role=doctor)
router.get("/", async (req, res) => {
  const { role } = req.query;
  const query = role ? { role } : {};
  const users = await User.find(query).select("-password");
  res.json({ success: true, users });
});

// Get one
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.json({ success: false, message: "User not found" });
  res.json({ success: true, user });
});

// Update (name/email/password/specialty/location)
router.put("/:id", async (req, res) => {
  const { name, email, password, specialty, location } = req.body;

  const update = { name, email, specialty, location };
  if (password) update.password = await bcrypt.hash(password, 10);

  await User.findByIdAndUpdate(req.params.id, update, { runValidators: true });
  res.json({ success: true, message: "User updated" });
});

// Delete
router.delete("/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "User deleted" });
});

export default router;
