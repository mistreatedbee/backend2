import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: [
      "delete_doctor",
      "email_verified",
      "password_reset",
      "doctor_approved",
      "doctor_rejected",
      "appointment_cancelled",
      "user_created",
      "user_deleted"
    ],
    required: true
  },
  targetType: { type: String, enum: ["user", "appointment", "notification"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Index for efficient queries
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model("AuditLog", AuditLogSchema);

