import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

/**
 * Quick script to set admin credentials
 * Usage: node scripts/setAdmin.js <email> <password> [firstName] [lastName]
 * Example: node scripts/setAdmin.js admin@example.com MySecurePass123 Admin User
 */
async function setAdmin() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log("Usage: node scripts/setAdmin.js <email> <password> [firstName] [lastName]");
      console.log("Example: node scripts/setAdmin.js admin@health.com admin123 System Admin");
      process.exit(1);
    }

    const email = args[0];
    const password = args[1];
    const firstName = args[2] || "System";
    const lastName = args[3] || "Admin";

    console.log("🔐 Setting up admin account...\n");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin exists
    const existingAdmin = await User.findOne({ 
      role: "admin",
      email: email.toLowerCase().trim()
    });

    if (existingAdmin) {
      // Update existing admin
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.firstName = firstName;
      existingAdmin.lastName = lastName;
      existingAdmin.email = email.toLowerCase().trim();
      existingAdmin.emailVerified = true;
      existingAdmin.isActive = true;
      existingAdmin.deletedAt = null;
      await existingAdmin.save();

      console.log("✅ Admin account updated!");
    } else {
      // Check if there's any admin with different email
      const anyAdmin = await User.findOne({ role: "admin" });
      
      if (anyAdmin) {
        // Update the existing admin's email and password
        anyAdmin.email = email.toLowerCase().trim();
        anyAdmin.passwordHash = passwordHash;
        anyAdmin.firstName = firstName;
        anyAdmin.lastName = lastName;
        anyAdmin.emailVerified = true;
        anyAdmin.isActive = true;
        anyAdmin.deletedAt = null;
        await anyAdmin.save();
        console.log("✅ Admin account updated!");
      } else {
        // Create new admin
        await User.create({
          firstName: firstName,
          lastName: lastName,
          email: email.toLowerCase().trim(),
          passwordHash: passwordHash,
          role: "admin",
          emailVerified: true,
          isActive: true,
          deletedAt: null
        });
        console.log("✅ Admin account created!");
      }
    }

    console.log("\n📋 Admin Credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log("\n✅ You can now login with these credentials!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

setAdmin();

