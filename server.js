/* eslint-env node */
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import appointmentRoutes from "./routes/appointments.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import doctorRoutes from "./routes/doctors.js";
import patientRoutes from "./routes/patients.js";
import adminRoutes from "./routes/admin.js";
import pushRoutes from "./routes/push.js";
import notificationRoutes from "./routes/notifications.js";
import notesRoutes from "./routes/notes.js";
import { setupChangeStreams, setIOInstance } from "./utils/changeStreams.js";
import { setIONotifications } from "./utils/notifications.js";

// Load environment variables
// dotenv will automatically look for .env in the current working directory
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const socketOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  "https://healthappbackend-my3d.onrender.com"
].filter(Boolean);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? socketOrigins 
      : "*", // Allow all in development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set IO instance for change streams and notifications
setIOInstance(io);
setIONotifications(io);

/* ---------------------------------------------------
   ✅ CORS FIX — ALLOW React Web App Access
--------------------------------------------------- */
// CORS configuration - allow all origins in development, specific origins in production
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      
      // In development, allow all origins
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      
      // In production, check allowed origins
      const allowedOrigins = [
        "http://localhost:5173",
        "https://healthappbackend-my3d.onrender.com",
        process.env.FRONTEND_URL,
        // Add your frontend URL here if deployed
      ].filter(Boolean);
      
      if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, '')))) {
        return callback(null, true);
      }
      
      // For now, allow all origins (you can restrict this later)
      console.log("⚠️  CORS: Allowing origin:", origin);
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

/* ---------------------------------------------------
   ✅ Debug Log
--------------------------------------------------- */
// Check environment variables after dotenv.config()
const mongoUri = process.env.MONGO_URI;
console.log("🔍 MONGO_URI Loaded:", mongoUri ? "YES ✅" : "NO ❌");
if (!mongoUri) {
  console.log("⚠️  Warning: MONGO_URI not found in environment variables");
  console.log("   Make sure .env file exists in the backend directory");
  console.log("   Current working directory:", process.cwd());
}

/* ---------------------------------------------------
   ✅ MongoDB Connect
--------------------------------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    // Set up change streams after connection
    setupChangeStreams();
  })
  .catch((error) => console.log("❌ MongoDB Connection Error:", error.message));

/* ---------------------------------------------------
   ✅ Firebase Admin Setup (FCM Notifications)
--------------------------------------------------- */
(function initFirebaseAdmin() {
  try {
    if (admin.apps.length) return;
    const keyPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        ? process.env.GOOGLE_APPLICATION_CREDENTIALS
        : path.resolve("./firebase-service-account.json");

    if (fs.existsSync(keyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized with service account");
    } else {
      console.log("⚠️ Firebase Admin not initialized (service account not found)");
    }
  } catch (e) {
    console.log("⚠️ Firebase Admin init error:", e.message);
  }
})();

/* ---------------------------------------------------
   ✅ Test Route
--------------------------------------------------- */
app.get("/", (_req, res) => {
  res.send("✅ Backend API is running correctly");
});

/* ---------------------------------------------------
   ✅ Routes
--------------------------------------------------- */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/prescriptions", prescriptionRoutes);
app.use("/doctors", doctorRoutes);
app.use("/patients", patientRoutes);
app.use("/admin", adminRoutes);
app.use("/push", pushRoutes);
app.use("/notifications", notificationRoutes);
app.use("/notes", notesRoutes); // ✅ Add this

/* ---------------------------------------------------
   ✅ Socket.IO Connection Handling
--------------------------------------------------- */
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // Join user-specific room
  socket.on("join:user", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room: user:${userId}`);
  });

  // Join doctor-specific room
  socket.on("join:doctor", (doctorId) => {
    socket.join(`doctor:${doctorId}`);
    console.log(`Doctor ${doctorId} joined room: doctor:${doctorId}`);
  });

  // Join patient room
  socket.on("join:patient", () => {
    socket.join("patient:all");
  });

  // Join admin room
  socket.on("join:admin", () => {
    socket.join("admin:all");
  });

  // Join notifications room
  socket.on("join:notifications", (userId) => {
    socket.join(`notifications:${userId}`);
    console.log(`User ${userId} joined notifications room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* ---------------------------------------------------
   ✅ Start Server
--------------------------------------------------- */
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server Running → http://localhost:${PORT}`)
);

export default app;
