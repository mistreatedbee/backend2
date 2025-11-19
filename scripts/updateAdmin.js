import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";
import readline from "readline";

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function updateAdmin() {
  try {
    console.log("🔐 Admin Account Manager");
    console.log("========================");
    console.log("");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get admin email
    const email = await question("Enter admin email (default: admin@health.com): ");
    const adminEmail = email.trim() || "admin@health.com";

    // Get admin password
    const password = await question("Enter admin password (default: admin123): ");
    const adminPassword = password.trim() || "admin123";

    // Get admin name
    const firstName = await question("Enter first name (default: System): ");
    const adminFirstName = firstName.trim() || "System";
    
    const lastName = await question("Enter last name (default: Admin): ");
    const adminLastName = lastName.trim() || "Admin";

    console.log("\n🔄 Processing...\n");

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Check if admin exists
    const existingAdmin = await User.findOne({ 
      role: "admin",
      email: adminEmail.toLowerCase().trim()
    });

    if (existingAdmin) {
      // Update existing admin
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.firstName = adminFirstName;
      existingAdmin.lastName = adminLastName;
      existingAdmin.email = adminEmail.toLowerCase().trim();
      existingAdmin.emailVerified = true; // Admin doesn't need email verification
      existingAdmin.isActive = true;
      existingAdmin.deletedAt = null;
      await existingAdmin.save();

      console.log("✅ Admin account updated successfully!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Name: ${adminFirstName} ${adminLastName}`);
    } else {
      // Create new admin
      await User.create({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail.toLowerCase().trim(),
        passwordHash: passwordHash,
        role: "admin",
        emailVerified: true,
        isActive: true,
        deletedAt: null
      });

      console.log("✅ Admin account created successfully!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Name: ${adminFirstName} ${adminLastName}`);
    }

    console.log("\n✅ Done! You can now login with these credentials.");
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

updateAdmin();

