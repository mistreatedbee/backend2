import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

/**
 * Fix users that still have "password" field instead of "passwordHash"
 * This script migrates old password field to passwordHash
 */
async function fixUserPasswords() {
  try {
    console.log("🔄 Fixing user passwords...\n");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find users with old "password" field
    const usersWithOldPassword = await User.find({ 
      password: { $exists: true },
      passwordHash: { $exists: false }
    });

    if (usersWithOldPassword.length === 0) {
      console.log("✅ No users need password migration. All users already use passwordHash.");
      process.exit(0);
    }

    console.log(`📝 Found ${usersWithOldPassword.length} users with old password field\n`);

    let fixed = 0;
    for (const user of usersWithOldPassword) {
      try {
        // If password is already hashed (starts with $2), use it directly
        // Otherwise, hash it (though this shouldn't happen)
        if (user.password && user.password.startsWith("$2")) {
          // Already hashed, just copy it
          await User.findByIdAndUpdate(user._id, {
            $set: { passwordHash: user.password },
            $unset: { password: "" }
          });
        } else if (user.password) {
          // Not hashed (shouldn't happen, but just in case)
          const hashed = await bcrypt.hash(user.password, 10);
          await User.findByIdAndUpdate(user._id, {
            $set: { passwordHash: hashed },
            $unset: { password: "" }
          });
        }
        fixed++;
        console.log(`✅ Fixed: ${user.email}`);
      } catch (error) {
        console.error(`❌ Error fixing ${user.email}:`, error.message);
      }
    }

    console.log(`\n✅ Fixed ${fixed} users`);
    console.log("✅ Password migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixUserPasswords();

