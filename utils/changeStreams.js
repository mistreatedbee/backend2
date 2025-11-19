import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import DoctorAvailability from "../models/DoctorAvailability.js";

let ioInstance = null;

/**
 * Initialize change streams with Socket.IO instance
 */
export const setIOInstance = (io) => {
  ioInstance = io;
};

/**
 * Set up MongoDB Change Streams for real-time updates
 * Emits events via Socket.IO to connected clients
 */
export const setupChangeStreams = () => {
  if (!ioInstance) {
    console.warn("⚠️ Socket.IO instance not set, change streams will not emit events");
    return;
  }
  console.log("🔄 Setting up MongoDB Change Streams...");

  // User changes
  const userStream = User.watch([], { fullDocument: "updateLookup" });
  userStream.on("change", (change) => {
    const doc = change.fullDocument || change.documentKey;
    if (!doc) return;

    // Emit to user-specific room
    ioInstance.to(`user:${doc._id}`).emit("user:updated", {
      type: change.operationType,
      document: doc
    });

    // Emit to role-specific rooms
    if (doc.role) {
      ioInstance.to(`${doc.role}:all`).emit("user:updated", {
        type: change.operationType,
        document: doc
      });
    }

    // Emit to admin room
    ioInstance.to("admin:all").emit("user:updated", {
      type: change.operationType,
      document: doc
    });
  });

  // Appointment changes
  const appointmentStream = Appointment.watch([], { fullDocument: "updateLookup" });
  appointmentStream.on("change", (change) => {
    const doc = change.fullDocument || change.documentKey;
    if (!doc) return;

    // Emit to doctor
    if (doc.doctorId) {
      ioInstance.to(`doctor:${doc.doctorId}`).emit("appointment:updated", {
        type: change.operationType,
        document: doc
      });
    }

    // Emit to patient
    if (doc.patientId) {
      ioInstance.to(`user:${doc.patientId}`).emit("appointment:updated", {
        type: change.operationType,
        document: doc
      });
    }

    // Emit to admin
    ioInstance.to("admin:all").emit("appointment:updated", {
      type: change.operationType,
      document: doc
    });
  });

  // Notification changes
  const notificationStream = Notification.watch([], { fullDocument: "updateLookup" });
  notificationStream.on("change", (change) => {
    const doc = change.fullDocument || change.documentKey;
    if (!doc) return;

    // Emit to recipient
    if (doc.to && doc.to.id) {
      ioInstance.to(`notifications:${doc.to.id}`).emit("notification:new", doc);
    }
  });

  // Doctor availability changes
  const availabilityStream = DoctorAvailability.watch([], { fullDocument: "updateLookup" });
  availabilityStream.on("change", (change) => {
    const doc = change.fullDocument || change.documentKey;
    if (!doc) return;

    // Emit to doctor
    if (doc.doctorId) {
      ioInstance.to(`doctor:${doc.doctorId}`).emit("availability:updated", {
        type: change.operationType,
        document: doc
      });
    }

    // Emit to all patients (they can see availability)
    ioInstance.to("patient:all").emit("availability:updated", {
      type: change.operationType,
      document: doc
    });
  });

  console.log("✅ Change Streams initialized");
};

