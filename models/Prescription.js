import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patientId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    medications: [
      {
        name:         { type: String, required: true },
        dosage:       { type: String, required: true },
        duration:     { type: String, required: true },
        // Either frequency OR instructions can be used (frontend supports both)
        frequency:    { type: String, required: false },
        instructions: { type: String, required: false },
      },
    ],

    notes:    { type: String },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);
