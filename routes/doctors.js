import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

// Get all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Get all approved doctors
router.get("/approved", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor", status: "approved" });
    res.json(doctors);
  } catch (err) {
    console.error("Error fetching approved doctors:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Get doctor by ID
router.get("/:id", async (req, res) => {
  try {
    // ✅ Fix: Validate if req.params.id is a valid ObjectId to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send("Invalid doctor ID");
    }

    const doctor = await User.findById(req.params.id);
    if (!doctor) return res.status(404).send("Doctor not found");
    res.json(doctor);
  } catch (err) {
    console.error("Error fetching doctor by ID:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Approve / Reject Doctor
router.put("/:id/status", async (req, res) => {
  try {
    // ✅ Fix: Validate if req.params.id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid doctor ID" });
    }

    const { status } = req.body; // approved | rejected | pending
    const actorId = req.user?._id || null; // Assuming you have auth middleware
    
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Create audit log
    await AuditLog.create({
      actorId: actorId || doctor._id,
      action: status === "approved" ? "doctor_approved" : "doctor_rejected",
      targetType: "user",
      targetId: doctor._id,
      details: { status, previousStatus: doctor.status }
    });

    // Send notification to doctor
    const notificationTitle = status === "approved" 
      ? "Application Approved" 
      : "Application Rejected";
    const notificationMessage = status === "approved"
      ? "Congratulations! Your doctor application has been approved. You can now start accepting appointments."
      : "Your doctor application has been rejected. Please contact support for more information.";

    await createNotification({
      fromId: actorId || doctor._id,
      fromRole: "admin",
      fromName: "System Administrator",
      toId: doctor._id,
      toRole: "doctor",
      type: status === "approved" ? "doctor_approved" : "doctor_rejected",
      title: notificationTitle,
      message: notificationMessage
    });

    res.json(doctor);
  } catch (err) {
    console.error("Error updating doctor status:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
