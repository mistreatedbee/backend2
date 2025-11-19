/* eslint-disable no-undef */

import mongoose from "mongoose";
import Appointment from "./models/Appointment.js";
import User from "./models/User.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mobilehealth_user:mobilehealth123@myfirstcluster.oi6i2ke.mongodb.net/?appName=myFirstCluster";

async function fix() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    console.log("📦 Fetching doctors...");
    const doctors = await User.find({ role: "doctor" });

    console.log("🔁 Fixing doctorId references...");
    for (const doc of doctors) {
      await Appointment.updateMany(
        { doctorId: doc.id },     // ❌ old wrong ID
        { doctorId: doc._id }     // ✅ correct Mongo ID
      );
    }

    console.log("📦 Fetching patients...");
    const patients = await User.find({ role: "patient" });

    console.log("🔁 Fixing patientId references...");
    for (const p of patients) {
      await Appointment.updateMany(
        { patientId: p.id },      // ❌ old wrong ID
        { patientId: p._id }      // ✅ correct Mongo ID
      );
    }

    console.log("✅ DONE! All appointment references are now fixed.");
    process.exit();
  } catch (err) {
    console.error("❌ Fix failed:", err);
    process.exit(1);
  }
}

fix();
