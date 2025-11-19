import Notification from "../models/Notification.js";

let ioInstance = null;

export const setIONotifications = (io) => {
  ioInstance = io;
};

/**
 * Create a notification and emit real-time update
 */
export const createNotification = async ({
  fromId,
  fromRole,
  fromName,
  fromPhotoUrl,
  toId,
  toRole,
  type,
  title,
  message,
  meta = {}
}) => {
  try {
    const notification = await Notification.create({
      from: {
        id: fromId,
        role: fromRole,
        name: fromName,
        photoUrl: fromPhotoUrl || null
      },
      to: {
        id: toId,
        role: toRole
      },
      type,
      title,
      message,
      meta,
      read: false
    });

    // Emit real-time notification
    if (ioInstance) {
      ioInstance.to(`notifications:${toId}`).emit("notification:new", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Create notification for appointment events
 */
export const notifyAppointmentEvent = async (appointment, eventType, actorId, actorRole, actorName) => {
  const eventMessages = {
    booking_created: "A new appointment has been booked",
    booking_confirmed: "Your appointment has been confirmed",
    booking_cancelled: "An appointment has been cancelled",
    booking_completed: "An appointment has been completed"
  };

  const titles = {
    booking_created: "New Appointment",
    booking_confirmed: "Appointment Confirmed",
    booking_cancelled: "Appointment Cancelled",
    booking_completed: "Appointment Completed"
  };

  // Notify patient
  if (appointment.patientId) {
    await createNotification({
      fromId: actorId,
      fromRole: actorRole,
      fromName: actorName,
      toId: appointment.patientId,
      toRole: "patient",
      type: eventType,
      title: titles[eventType] || "Appointment Update",
      message: eventMessages[eventType] || "Your appointment has been updated",
      meta: {
        appointmentId: appointment._id,
        reason: appointment.reason
      }
    });
  }

  // Notify doctor
  if (appointment.doctorId) {
    await createNotification({
      fromId: actorId,
      fromRole: actorRole,
      fromName: actorName,
      toId: appointment.doctorId,
      toRole: "doctor",
      type: eventType,
      title: titles[eventType] || "Appointment Update",
      message: eventMessages[eventType] || "An appointment has been updated",
      meta: {
        appointmentId: appointment._id,
        reason: appointment.reason
      }
    });
  }
};

