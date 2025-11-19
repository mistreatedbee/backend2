import express from "express";
import Note from "../models/Note.js";
import Patient from "../routes/patients.js";

const router = express.Router();

// GET all notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notes", error: err.message });
  }
});

// CREATE a note
router.post("/", async (req, res) => {
  try {
    const patient = await Patient.findById(req.body.patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const note = await Note.create({
      ...req.body,
      patientName: patient.name,
    });

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error creating note", error: err.message });
  }
});

// UPDATE a note
router.put("/:id", async (req, res) => {
  try {
    const updated = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating note", error: err.message });
  }
});

export default router;
