import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    from: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["doctor", "patient", "admin"], required: true },
      name: { type: String, required: true },
      photoUrl: { type: String }
    },
    to: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["doctor", "patient", "admin"], required: true }
    },
    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "booking_cancelled",
        "booking_completed",
        "availability_changed",
        "note_added",
        "email_verified",
        "password_changed",
        "doctor_deleted",
        "prescription_issued",
        "appointment_reminder"
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: {
      appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
      reason: { type: String },
      extra: { type: mongoose.Schema.Types.Mixed }
    },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes for efficient queries
NotificationSchema.index({ "to.id": 1, read: 1, createdAt: -1 });
NotificationSchema.index({ "from.id": 1 });

export default mongoose.model("Notification", NotificationSchema);
