import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();

/* ---------- GET ALL PATIENTS OF A DOCTOR (PLACE THIS FIRST) ---------- */
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const appointments = await Appointment.find({ doctorId })
      .populate("patientId");

    const patients = appointments
      .map(a => a.patientId)
      .filter(Boolean);

    // Remove duplicates
    const uniquePatients = Array.from(
      new Map(patients.map(p => [p._id.toString(), p])).values()
    );

    res.json(uniquePatients);
  } catch (err) {
    console.error("❌ Error fetching patients for doctor:", err);
    res.status(500).json({ message: "Failed to load patients" });
  }
});

/* ---------- GET PATIENT BY ID ---------- */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await User.findById(id);

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (err) {
    console.error("❌ Error fetching patient:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ---------- UPDATE PATIENT PROFILE ---------- */
router.put("/:id", async (req, res) => {
  try {
    const updatedPatient = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(updatedPatient);
  } catch (err) {
    console.error("❌ Error updating patient:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ---------- DELETE PATIENT ACCOUNT ---------- */
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("❌ Error deleting patient:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
