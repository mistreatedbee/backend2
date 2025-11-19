import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["online", "in-person"], required: true },
  date: { type: Date, required: true }, // Keep for backward compatibility
  time: { type: String, required: true }, // Keep for backward compatibility
  startAt: { type: Date, required: false }, // New: ISO date for start
  endAt: { type: Date, required: false }, // New: ISO date for end
  reason: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled", "cancelled_by_admin"],
    default: "pending" 
  },
  videoCallLink: { type: String, default: null },
  notesId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: null }
}, { timestamps: true });

// Indexes for efficient queries
AppointmentSchema.index({ doctorId: 1, startAt: 1 });
AppointmentSchema.index({ patientId: 1, startAt: 1 });
AppointmentSchema.index({ status: 1 });

export default mongoose.model("Appointment", AppointmentSchema);
