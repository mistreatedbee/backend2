import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import AuditLog from "../models/AuditLog.js";

dotenv.config({ path: "./.env" });

/**
 * Migration script to:
 * 1. Add isActive and deletedAt fields to existing users
 * 2. Migrate password field to passwordHash
 * 3. Create all necessary indexes
 */
const migrate = async () => {
  try {
    console.log("🔄 Starting migration...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // 1. Update users: Add isActive and deletedAt, migrate password to passwordHash
    console.log("📝 Updating users...");
    const usersUpdate = await User.updateMany(
      {
        $or: [
          { isActive: { $exists: false } },
          { deletedAt: { $exists: false } },
          { password: { $exists: true } }
        ]
      },
      [
        {
          $set: {
            isActive: { $ifNull: ["$isActive", true] },
            deletedAt: { $ifNull: ["$deletedAt", null] },
            passwordHash: { $ifNull: ["$passwordHash", "$password"] }
          }
        },
        {
          $unset: "password"
        }
      ]
    );
    console.log(`✅ Updated ${usersUpdate.modifiedCount} users`);

    // 2. Create indexes
    console.log("📝 Creating indexes...");

    // User indexes
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
      console.log("✅ Created index: users.email");
    } catch (e) {
      console.log("⚠️ Index users.email may already exist");
    }

    try {
      await User.collection.createIndex({ role: 1 }, { background: true });
      console.log("✅ Created index: users.role");
    } catch (e) {
      console.log("⚠️ Index users.role may already exist");
    }

    try {
      await User.collection.createIndex({ isActive: 1 }, { background: true });
      console.log("✅ Created index: users.isActive");
    } catch (e) {
      console.log("⚠️ Index users.isActive may already exist");
    }

    try {
      await User.collection.createIndex(
        { "emailVerification.expiresAt": 1 },
        { expireAfterSeconds: 0, background: true }
      );
      console.log("✅ Created TTL index: users.emailVerification.expiresAt");
    } catch (e) {
      console.log("⚠️ TTL index may already exist");
    }

    try {
      await User.collection.createIndex(
        { "forgotPassword.expiresAt": 1 },
        { expireAfterSeconds: 0, background: true }
      );
      console.log("✅ Created TTL index: users.forgotPassword.expiresAt");
    } catch (e) {
      console.log("⚠️ TTL index may already exist");
    }

    // Appointment indexes
    try {
      await Appointment.collection.createIndex(
        { doctorId: 1, startAt: 1 },
        { background: true }
      );
      console.log("✅ Created index: appointments.doctorId + startAt");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    try {
      await Appointment.collection.createIndex(
        { patientId: 1, startAt: 1 },
        { background: true }
      );
      console.log("✅ Created index: appointments.patientId + startAt");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    try {
      await Appointment.collection.createIndex({ status: 1 }, { background: true });
      console.log("✅ Created index: appointments.status");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    // Notification indexes
    try {
      await Notification.collection.createIndex(
        { "to.id": 1, read: 1, createdAt: -1 },
        { background: true }
      );
      console.log("✅ Created index: notifications.to.id + read + createdAt");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    try {
      await Notification.collection.createIndex({ "from.id": 1 }, { background: true });
      console.log("✅ Created index: notifications.from.id");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    // DoctorAvailability indexes
    try {
      await DoctorAvailability.collection.createIndex({ doctorId: 1 }, { background: true });
      console.log("✅ Created index: doctorAvailability.doctorId");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    // AuditLog indexes
    try {
      await AuditLog.collection.createIndex(
        { actorId: 1, createdAt: -1 },
        { background: true }
      );
      console.log("✅ Created index: auditLogs.actorId + createdAt");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    try {
      await AuditLog.collection.createIndex(
        { targetType: 1, targetId: 1 },
        { background: true }
      );
      console.log("✅ Created index: auditLogs.targetType + targetId");
    } catch (e) {
      console.log("⚠️ Index may already exist");
    }

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
};

migrate();

