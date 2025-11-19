import mongoose from "mongoose";

const DoctorAvailabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  slots: [{
    slotId: { type: String, required: true }, // UUID
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    type: { type: String, enum: ["online", "in-person"], required: true },
    booked: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Indexes
DoctorAvailabilitySchema.index({ doctorId: 1 });

export default mongoose.model("DoctorAvailability", DoctorAvailabilitySchema);

