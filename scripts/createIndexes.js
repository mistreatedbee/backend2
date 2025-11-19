import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import AuditLog from "../models/AuditLog.js";

dotenv.config({ path: "./.env" });

/**
 * Standalone script to create all indexes
 * Run: node backend/scripts/createIndexes.js
 */
const createIndexes = async () => {
  try {
    console.log("🔄 Creating indexes...");

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex(
      { "emailVerification.expiresAt": 1 },
      { expireAfterSeconds: 0 }
    );
    await User.collection.createIndex(
      { "forgotPassword.expiresAt": 1 },
      { expireAfterSeconds: 0 }
    );
    console.log("✅ User indexes created");

    // Appointment indexes
    await Appointment.collection.createIndex({ doctorId: 1, startAt: 1 });
    await Appointment.collection.createIndex({ patientId: 1, startAt: 1 });
    await Appointment.collection.createIndex({ status: 1 });
    console.log("✅ Appointment indexes created");

    // Notification indexes
    await Notification.collection.createIndex({ "to.id": 1, read: 1, createdAt: -1 });
    await Notification.collection.createIndex({ "from.id": 1 });
    console.log("✅ Notification indexes created");

    // DoctorAvailability indexes
    await DoctorAvailability.collection.createIndex({ doctorId: 1 });
    console.log("✅ DoctorAvailability indexes created");

    // AuditLog indexes
    await AuditLog.collection.createIndex({ actorId: 1, createdAt: -1 });
    await AuditLog.collection.createIndex({ targetType: 1, targetId: 1 });
    console.log("✅ AuditLog indexes created");

    console.log("✅ All indexes created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
};

createIndexes();

