import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { generateToken, hashToken, compareToken } from "../utils/crypto.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

// Rate limiting store (simple in-memory, use Redis in production)
const rateLimitStore = new Map();

const checkRateLimit = (key, maxRequests, windowMs) => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now - record.firstRequest > windowMs) {
    rateLimitStore.set(key, { firstRequest: now, count: 1 });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

/* REGISTER PATIENT */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, ...rest } = req.body;

    const normalizedEmail = String(email || "").toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists)
      return res.status(400).json({ success: false, message: "Email already registered" });

    // Password validation
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate email verification token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      role: "patient",
      emailVerified: false,
      emailVerification: {
        hash: tokenHash,
        expiresAt
      },
      isActive: true,
      ...rest,
    });

    // Send verification email
    await sendVerificationEmail(user, rawToken);

    // Create audit log
    await AuditLog.create({
      actorId: user._id,
      action: "user_created",
      targetType: "user",
      targetId: user._id,
      details: { role: "patient" }
    });

    const { passwordHash: _pw, ...safe } = user.toObject();
    res.json({ 
      success: true, 
      user: safe,
      message: "Registration successful. Please check your email to verify your account."
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ success: false, message: "Patient registration failed" });
  }
});

/* REGISTER DOCTOR */
router.post("/register-doctor", async (req, res) => {
  try {
    const data = req.body;
    const normalizedEmail = String(data.email || "").toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists)
      return res.status(400).json({ success: false, message: "Email already registered" });

    // Password validation
    if (!data.password || data.password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Generate email verification token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const doctor = await User.create({
      ...data,
      email: normalizedEmail,
      passwordHash,
      role: "doctor",
      status: "pending",
      emailVerified: false,
      emailVerification: {
        hash: tokenHash,
        expiresAt
      },
      isActive: true,
    });

    // Send verification email
    await sendVerificationEmail(doctor, rawToken);

    // Create audit log
    await AuditLog.create({
      actorId: doctor._id,
      action: "user_created",
      targetType: "user",
      targetId: doctor._id,
      details: { role: "doctor" }
    });

    const { passwordHash: _pw, ...safe } = doctor.toObject();
    res.json({ 
      success: true, 
      user: safe,
      message: "Registration successful. Please check your email to verify your account."
    });
  } catch (e) {
    console.error("Doctor registration error:", e);
    res.status(500).json({ success: false, message: "Doctor registration failed" });
  }
});

/* VERIFY EMAIL */
router.post("/verify-email", async (req, res) => {
  try {
    const { id, token } = req.body;

    if (!id || !token) {
      return res.status(400).json({ success: false, message: "Missing id or token" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: "Email already verified" });
    }

    if (!user.emailVerification || !user.emailVerification.hash) {
      return res.status(400).json({ success: false, message: "No verification token found" });
    }

    // Check expiry
    if (new Date() > new Date(user.emailVerification.expiresAt)) {
      return res.status(400).json({ success: false, message: "Verification token expired" });
    }

    // Compare tokens
    if (!compareToken(token, user.emailVerification.hash)) {
      return res.status(400).json({ success: false, message: "Invalid verification token" });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerification = undefined;
    await user.save();

    // Create audit log
    await AuditLog.create({
      actorId: user._id,
      action: "email_verified",
      targetType: "user",
      targetId: user._id
    });

    // Create notification
    await createNotification({
      fromId: user._id,
      fromRole: user.role,
      fromName: `${user.firstName} ${user.lastName}`,
      toId: user._id,
      toRole: user.role,
      type: "email_verified",
      title: "Email Verified",
      message: "Your email has been successfully verified."
    });

    const { passwordHash: _pw, ...safe } = user.toObject();
    res.json({ success: true, user: safe, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ success: false, message: "Email verification failed" });
  }
});

/* RESEND VERIFICATION EMAIL */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    // Rate limiting: 3 requests per hour
    const rateLimitKey = `resend:${normalizedEmail}`;
    if (!checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: "If the email exists, a verification link has been sent." });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: "Email already verified" });
    }

    // Generate new token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerification = {
      hash: tokenHash,
      expiresAt
    };
    await user.save();

    // Send email
    await sendVerificationEmail(user, rawToken);

    res.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ success: false, message: "Failed to resend verification email" });
  }
});

/* FORGOT PASSWORD */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    // Rate limiting: 3 requests per hour
    const rateLimitKey = `forgot:${normalizedEmail}`;
    if (!checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: "If the email exists, a password reset link has been sent." });
    }

    // Generate reset token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.forgotPassword = {
      hash: tokenHash,
      expiresAt
    };
    await user.save();

    // Send email
    await sendPasswordResetEmail(user, rawToken);

    res.json({ success: true, message: "If the email exists, a password reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Failed to process request" });
  }
});

/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
  try {
    const { id, token, newPassword } = req.body;

    if (!id || !token || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.forgotPassword || !user.forgotPassword.hash) {
      return res.status(400).json({ success: false, message: "No reset token found" });
    }

    // Check expiry
    if (new Date() > new Date(user.forgotPassword.expiresAt)) {
      return res.status(400).json({ success: false, message: "Reset token expired" });
    }

    // Compare tokens
    if (!compareToken(token, user.forgotPassword.hash)) {
      return res.status(400).json({ success: false, message: "Invalid reset token" });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.forgotPassword = undefined;
    await user.save();

    // Create audit log
    await AuditLog.create({
      actorId: user._id,
      action: "password_reset",
      targetType: "user",
      targetId: user._id
    });

    // Create notification
    await createNotification({
      fromId: user._id,
      fromRole: user.role,
      fromName: `${user.firstName} ${user.lastName}`,
      toId: user._id,
      toRole: user.role,
      type: "password_changed",
      title: "Password Changed",
      message: "Your password has been successfully changed."
    });

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    console.log("🔐 Login attempt:", { email: email ? email.substring(0, 10) + "..." : "missing", hasPassword: !!password });

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Normalize email
    email = email.toLowerCase().trim();
    console.log("📧 Normalized email:", email);

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      console.log("❌ User not found or inactive:", email);
      // Try to find user without isActive check for debugging
      const userDebug = await User.findOne({ email });
      if (userDebug) {
        console.log("   Found user but isActive:", userDebug.isActive, "deletedAt:", userDebug.deletedAt);
      }
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    console.log("✅ User found:", user.email, "role:", user.role);

    // Handle both passwordHash (new) and password (old) fields
    let passwordToCompare = user.passwordHash || user.password;
    
    if (!passwordToCompare) {
      console.error("❌ User has no password field:", user.email);
      return res.status(500).json({ success: false, message: "User account error. Please contact support." });
    }

    // Check if email is verified (optional - can be made required)
    // if (!user.emailVerified) {
    //   return res.status(400).json({ success: false, message: "Please verify your email before logging in" });
    // }

    console.log("🔐 Comparing password...");
    const isMatch = await bcrypt.compare(password, passwordToCompare);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    console.log("✅ Password correct for:", email);

    // Migrate old password to passwordHash if needed
    if (user.password && !user.passwordHash) {
      user.passwordHash = user.password;
      user.password = undefined;
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    const { passwordHash: _pw, password: _p, ...safeUser } = user.toObject();
    return res.json({ success: true, user: safeUser });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
});

/* CURRENT USER */
router.get("/me/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

export default router;
