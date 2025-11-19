import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Identity
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }, // Changed from 'password' to 'passwordHash'
    role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },
    
    // Email verification
    emailVerified: { type: Boolean, default: false },
    emailVerification: {
      hash: { type: String },
      expiresAt: { type: Date }
    },
    
    // Forgot password
    forgotPassword: {
      hash: { type: String },
      expiresAt: { type: Date }
    },
    
    // Profile (flexible structure)
    profile: {
      age: { type: Number },
      province: { type: String },
      city: { type: String },
      specialties: [{ type: String }], // For doctors
      location: {
        lat: { type: Number },
        lng: { type: Number }
      },
      bio: { type: String },
      photoUrl: { type: String }
    },
    
    // Shared fields (kept for backward compatibility)
    phone: { type: String },
    province: { type: String },
    city: { type: String },
    
    // Patient profile fields
    age: { type: Number },
    gender: { type: String },
    dateOfBirth: { type: String },
    bloodType: { type: String },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    currentMedications: [{ type: String }],
    pastProcedures: [{ type: String }],
    medicalHistory: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    
    // Doctor fields
    specialty: { type: String },
    registrationNumber: { type: String },
    yearsOfExperience: { type: Number },
    clinicName: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    
    // Soft delete
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    
    // Activity tracking
    lastSeen: { type: Date, default: Date.now },
    
    // Push notifications
    pushToken: { type: String }
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "emailVerification.expiresAt": 1 }, { expireAfterSeconds: 0 }); // TTL
userSchema.index({ "forgotPassword.expiresAt": 1 }, { expireAfterSeconds: 0 }); // TTL

export default mongoose.model("User", userSchema);
