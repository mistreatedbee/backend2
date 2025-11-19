/* eslint-disable no-undef */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import User from "../models/User.js";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const email = "admin@health.com";
    const password = "admin123";
    const exists = await User.findOne({ email: email, role: "admin" });
    
    if (exists) {
      console.log("✅ Admin already exists.");
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log("\n💡 To change admin credentials, run:");
      console.log("   node scripts/setAdmin.js <email> <password>");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      firstName: "System",
      lastName: "Admin",
      email: email,
      passwordHash: passwordHash,
      role: "admin",
      emailVerified: true,
      isActive: true,
      deletedAt: null
    });

    console.log("✅ Admin account created:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log("\n💡 To change admin credentials, run:");
    console.log("   node scripts/setAdmin.js <email> <password>");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
