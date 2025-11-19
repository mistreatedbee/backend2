import express from "express";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/sendNotification.js";
import mongoose from "mongoose";

const router = express.Router();

/* ---------------------- CREATE ---------------------- */
router.post("/", async (req, res) => {
  try {
    const { patientId, doctorId, type, date, time, reason } = req.body;

    if (!patientId || !doctorId || !type || !date || !time || !reason) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const appt = await Appointment.create({
      patientId: new mongoose.Types.ObjectId(patientId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      type,
      date: new Date(date),
      time,
      reason,
      status: "pending",
    });

    res.json({ success: true, appointment: appt });
  } catch (e) {
    console.error("❌ Create appointment error:", e.message);
    res.status(500).json({ success: false, message: "Error creating appointment" });
  }
});

/* ---------------------- LIST ALL (ADMIN) ---------------------- */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const list = await Appointment.find(filter)
      .populate("patientId", "firstName lastName email phone city province")
      .populate("doctorId", "firstName lastName specialty clinicName city province phone")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("❌ Error fetching appointments:", err);
    res.status(500).json({ message: "Failed to load appointments" });
  }
});

/* ---------------------- BY PATIENT ---------------------- */
router.get("/patient/:id", async (req, res) => {
  try {
    const list = await Appointment.find({ patientId: req.params.id })
      .populate("doctorId", "firstName lastName specialty clinicName phone email city province")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("❌ Error fetching patient appointments:", err);
    res.status(500).json({ message: "Failed to load appointments" });
  }
});

/* ---------------------- BY DOCTOR ---------------------- */
router.get("/doctor/:id", async (req, res) => {
  try {
    const list = await Appointment.find({ doctorId: req.params.id })
      .populate(
        "patientId",
        "firstName lastName email phone city province dateOfBirth gender bloodType chronicConditions currentMedications allergies emergencyContactName emergencyContactPhone pastProcedures"
      )
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("❌ Get doctor appointments error:", err);
    res.status(500).json({ message: "Failed to fetch doctor appointments" });
  }
});

/* ---------------------- GET ONE (✅ FULL MEDICAL PROFILE ADDED) ---------------------- */
router.get("/:id", async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate("doctorId", "firstName lastName specialty clinicName phone city province")
      .populate(
        "patientId",
        "firstName lastName email phone city province dateOfBirth gender bloodType allergies chronicConditions currentMedications pastProcedures emergencyContactName emergencyContactPhone"
      );

    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    res.json(appt);
  } catch (err) {
    console.error("❌ Get appointment error:", err);
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
});

/* ---------------------- UPDATE ---------------------- */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update appointment error:", err);
    res.status(500).json({ message: "Failed to update appointment" });
  }
});

/* ---------------------- UPDATE STATUS + NOTIFY ---------------------- */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Appointment not found" });

    const patient = await User.findById(updated.patientId);

    if (patient?.pushToken) {
      await sendNotification(
        patient.pushToken,
        "Appointment Update",
        `Your appointment has been ${status}.`,
        { appointmentId: String(updated._id) }
      );
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Update status error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

/* ---------------------- CANCEL ---------------------- */
router.put("/:id/cancel", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Cancel appointment error:", err);
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

/* ---------------------- GENERATE VIDEO LINK ---------------------- */
router.post("/:id/video-link", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const roomName = `mobilehealth-${appointmentId}`;
    const link = `https://meet.jit.si/${roomName}`;

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      { videoCallLink: link },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Appointment not found" });

    res.json({ link, appointment: updated });
  } catch (error) {
    console.error("❌ Video link error:", error);
    res.status(500).json({ message: "Failed to generate video link" });
  }
});

/* ---------------------- DELETE ---------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    console.error("❌ Delete appointment error:", err);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

export default router;
