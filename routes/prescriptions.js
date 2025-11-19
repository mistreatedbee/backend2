import express from "express";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/sendNotification.js";

const router = express.Router();

/* ---------------------- CREATE + NOTIFY ---------------------- */
router.post("/", async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId, medications, notes } = req.body;

    const prescription = await Prescription.create({
      appointmentId,
      patientId,
      doctorId,
      medications,
      notes,
    });

    const patient = await User.findById(patientId);
    if (patient?.pushToken) {
      await sendNotification(
        patient.pushToken,
        "New Prescription Issued",
        "A new prescription has been issued. View it in your app.",
        { appointmentId: String(appointmentId), prescriptionId: String(prescription._id) }
      );
    }

    res.json(prescription);
  } catch (err) {
    console.error("❌ Error creating prescription:", err);
    res.status(500).json({ message: "Error creating prescription" });
  }
});

/* ---------------------- GET BY PATIENT ---------------------- */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const list = await Prescription.find({ patientId })
      .populate("doctorId", "firstName lastName email phone specialty clinicName city province")
      .populate("appointmentId", "date time type status") // ✅ Added population
      .sort({ issuedAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("❌ Error fetching patient prescriptions:", err);
    res.status(500).json({ message: "Error fetching prescriptions" });
  }
});


/* ---------------------- GET BY APPOINTMENT ---------------------- */
router.get("/appointment/:appointmentId", async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      appointmentId: req.params.appointmentId,
    })
      .populate("doctorId", "firstName lastName email phone specialty clinicName city province")
      .populate("patientId", "firstName lastName email phone city province dateOfBirth gender bloodType chronicConditions currentMedications allergies");

    if (!prescription)
      return res.status(404).json({ message: "Prescription not found" });

    res.json(prescription);
  } catch (err) {
    console.error("❌ Error fetching prescription:", err);
    res.status(500).json({ message: "Error fetching prescription" });
  }
});

/* ---------------------- DELETE ---------------------- */
router.delete("/:id", async (req, res) => {
  try {
    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ message: "Prescription deleted" });
  } catch (err) {
    console.error("❌ Delete prescription error:", err);
    res.status(500).json({ message: "Error deleting prescription" });
  }
});

export default router;
