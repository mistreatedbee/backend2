import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import AuditLog from "../models/AuditLog.js";
import { createNotification, notifyAppointmentEvent } from "../utils/notifications.js";

const router = express.Router();

/* GET ALL PATIENTS */
router.get("/patients", async (req, res) => {
  try {
    const users = await User.find({ role: "patient", isActive: true, deletedAt: null })
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

/* DELETE USER (Generic) */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Soft delete
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    // Create audit log
    await AuditLog.create({
      actorId: req.user?._id || user._id, // Assuming you have auth middleware
      action: "user_deleted",
      targetType: "user",
      targetId: user._id,
      details: { role: user.role }
    });

    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/* GET ALL DOCTORS */
router.get("/doctors", async (req, res) => {
  try {
    const { includeDeleted, status } = req.query;
    const query = { role: "doctor" };
    
    if (includeDeleted !== "true") {
      query.isActive = true;
      query.deletedAt = null;
    }

    // Filter by status if provided (pending, approved, rejected)
    if (status) {
      query.status = status;
    }

    const doctors = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

/* DELETE DOCTOR (Soft or Hard) */
router.delete("/doctors/:doctorId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { doctorId } = req.params;
    const { hard = false } = req.body; // Default to soft delete
    const actorId = req.user?._id || null; // Assuming you have auth middleware

    const doctor = await User.findById(doctorId).session(session);
    if (!doctor) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.role !== "doctor") {
      await session.abortTransaction();
      return res.status(400).json({ error: "User is not a doctor" });
    }

    const now = new Date();

    if (hard) {
      // HARD DELETE - Only after backup/export
      // Find all future appointments
      const futureAppointments = await Appointment.find({
        doctorId: doctor._id,
        startAt: { $gte: now },
        status: { $in: ["pending", "confirmed"] }
      }).session(session);

      // Cancel all future appointments
      for (const appointment of futureAppointments) {
        appointment.status = "cancelled_by_admin";
        appointment.updatedAt = now;
        await appointment.save({ session });

        // Notify patient
        await notifyAppointmentEvent(
          appointment,
          "booking_cancelled",
          actorId || doctor._id,
          "admin",
          "System Administrator"
        );
      }

      // Delete doctor (hard delete)
      await User.findByIdAndDelete(doctorId).session(session);

      // Create audit log
      await AuditLog.create([{
        actorId: actorId || doctor._id,
        action: "delete_doctor",
        targetType: "user",
        targetId: doctor._id,
        details: {
          hard: true,
          cancelledAppointments: futureAppointments.length
        }
      }], { session });

      await session.commitTransaction();
      res.json({
        success: true,
        message: `Doctor permanently deleted. ${futureAppointments.length} appointments cancelled.`
      });
    } else {
      // SOFT DELETE
      // Update doctor
      doctor.isActive = false;
      doctor.deletedAt = now;
      await doctor.save({ session });

      // Find all future appointments
      const futureAppointments = await Appointment.find({
        doctorId: doctor._id,
        $or: [
          { startAt: { $gte: now } },
          { date: { $gte: now } } // Backward compatibility
        ],
        status: { $in: ["pending", "confirmed"] }
      }).session(session);

      // Cancel all future appointments
      for (const appointment of futureAppointments) {
        appointment.status = "cancelled_by_admin";
        appointment.updatedAt = now;
        await appointment.save({ session });

        // Notify patient and doctor
        await notifyAppointmentEvent(
          appointment,
          "booking_cancelled",
          actorId || doctor._id,
          "admin",
          "System Administrator"
        );
      }

      // Notify doctor
      await createNotification({
        fromId: actorId || doctor._id,
        fromRole: "admin",
        fromName: "System Administrator",
        toId: doctor._id,
        toRole: "doctor",
        type: "doctor_deleted",
        title: "Account Deactivated",
        message: "Your doctor account has been deactivated by an administrator.",
        meta: {
          cancelledAppointments: futureAppointments.length
        }
      });

      // Create audit log
      await AuditLog.create([{
        actorId: actorId || doctor._id,
        action: "delete_doctor",
        targetType: "user",
        targetId: doctor._id,
        details: {
          hard: false,
          cancelledAppointments: futureAppointments.length
        }
      }], { session });

      await session.commitTransaction();
      res.json({
        success: true,
        message: `Doctor deactivated. ${futureAppointments.length} appointments cancelled.`,
        cancelledAppointments: futureAppointments.length
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting doctor:", error);
    res.status(500).json({ error: "Failed to delete doctor" });
  } finally {
    session.endSession();
  }
});

/* RESTORE DOCTOR */
router.post("/doctors/:doctorId/restore", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const actorId = req.user?._id || null;

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({ error: "User is not a doctor" });
    }

    doctor.isActive = true;
    doctor.deletedAt = null;
    await doctor.save();

    // Create audit log
    await AuditLog.create({
      actorId: actorId || doctor._id,
      action: "doctor_approved", // Reusing action type
      targetType: "user",
      targetId: doctor._id,
      details: { action: "restore" }
    });

    res.json({ success: true, message: "Doctor restored successfully" });
  } catch (error) {
    console.error("Error restoring doctor:", error);
    res.status(500).json({ error: "Failed to restore doctor" });
  }
});

/* GET STATS */
router.get("/stats", async (req, res) => {
  try {
    const users = await User.find({ isActive: true, deletedAt: null });
    const appointments = await Appointment.find();

    res.json({
      totalPatients: users.filter(u => u.role === "patient").length,
      totalDoctors: users.filter(u => u.role === "doctor" && u.status === "approved").length,
      totalAppointments: appointments.length,
      onlineAppointments: appointments.filter(a => a.type === "online").length,
      inPersonAppointments: appointments.filter(a => a.type === "in-person").length
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
