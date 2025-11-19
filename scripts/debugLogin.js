import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function debugLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const email = "admin@gmail.com";
    const password = "hacked";
    const normalizedEmail = email.toLowerCase().trim();

    console.log("🔍 Debugging Login Process\n");
    console.log("Input:");
    console.log("  Email:", email);
    console.log("  Normalized:", normalizedEmail);
    console.log("  Password:", password);
    console.log("");

    // Find user
    const user = await User.findOne({ email: normalizedEmail, isActive: true });
    
    if (!user) {
      console.log("❌ User not found with query: { email: '" + normalizedEmail + "', isActive: true }");
      
      // Try without isActive
      const userWithoutActive = await User.findOne({ email: normalizedEmail });
      if (userWithoutActive) {
        console.log("⚠️  User found but isActive is:", userWithoutActive.isActive);
        console.log("   User details:", {
          email: userWithoutActive.email,
          role: userWithoutActive.role,
          isActive: userWithoutActive.isActive,
          deletedAt: userWithoutActive.deletedAt
        });
      } else {
        // Try case-insensitive search
        const allUsers = await User.find({});
        const matching = allUsers.filter(u => u.email.toLowerCase() === normalizedEmail);
        if (matching.length > 0) {
          console.log("⚠️  Found user(s) with similar email:");
          matching.forEach(u => {
            console.log("   Email:", u.email, "| isActive:", u.isActive, "| role:", u.role);
          });
        } else {
          console.log("❌ No user found with email:", normalizedEmail);
          console.log("\nAll users in database:");
          const all = await User.find({}).select("email role isActive");
          all.forEach(u => console.log("  -", u.email, "| role:", u.role, "| isActive:", u.isActive));
        }
      }
      process.exit(1);
    }

    console.log("✅ User found:");
    console.log("  Email:", user.email);
    console.log("  Role:", user.role);
    console.log("  isActive:", user.isActive);
    console.log("  Has passwordHash:", !!user.passwordHash);
    console.log("  Has password (old):", !!user.password);
    console.log("");

    // Check password
    const passwordToCompare = user.passwordHash || user.password;
    
    if (!passwordToCompare) {
      console.log("❌ User has no password field!");
      process.exit(1);
    }

    console.log("🔐 Testing password...");
    const isMatch = await bcrypt.compare(password, passwordToCompare);
    
    if (isMatch) {
      console.log("✅ Password is CORRECT!");
      console.log("\n✅ Login should work!");
      console.log("\nIf login still fails, check:");
      console.log("  1. Backend URL in frontend .env");
      console.log("  2. CORS settings in backend");
      console.log("  3. Network tab in browser DevTools");
    } else {
      console.log("❌ Password is INCORRECT!");
      console.log("   The password 'hacked' does not match.");
      console.log("\n💡 To reset password:");
      console.log("   node scripts/setAdmin.js admin@gmail.com <new-password>");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugLogin();

