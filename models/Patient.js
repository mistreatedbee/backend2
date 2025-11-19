import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    city: { type: String },
    province: { type: String },

    // ✅ Medical profile fields
    bloodType: { type: String },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    pastProcedures: { type: [String], default: [] },

    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", PatientSchema);
