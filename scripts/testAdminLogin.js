import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function testAdminLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const email = "admin@gmail.com";
    const password = "hacked";

    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
    
    if (!user) {
      console.log("❌ Admin user not found!");
      console.log("   Email:", email);
      process.exit(1);
    }

    console.log("📋 Admin User Found:");
    console.log("   Email:", user.email);
    console.log("   Role:", user.role);
    console.log("   isActive:", user.isActive);
    console.log("   Has passwordHash:", !!user.passwordHash);
    console.log("   Has password (old):", !!user.password);
    console.log("");

    // Test password
    const passwordToCompare = user.passwordHash || user.password;
    
    if (!passwordToCompare) {
      console.log("❌ Admin has no password set!");
      process.exit(1);
    }

    const isMatch = await bcrypt.compare(password, passwordToCompare);
    
    if (isMatch) {
      console.log("✅ Password is CORRECT!");
      console.log("   You should be able to login with:");
      console.log("   Email: admin@gmail.com");
      console.log("   Password: hacked");
    } else {
      console.log("❌ Password is INCORRECT!");
      console.log("   The password 'hacked' does not match the stored password.");
      console.log("\n💡 To reset the password, run:");
      console.log("   node scripts/setAdmin.js admin@gmail.com <new-password>");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testAdminLogin();

