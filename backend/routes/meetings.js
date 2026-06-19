import express from "express";
import Meeting from "../models/Meeting.js";
import { sendMeetingEmail } from "../utils/emailService.js";

const router = express.Router();

// Helper to generate a random Google Meet link
const generateGoogleMeetLink = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const part1 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const part3 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  return `https://meet.google.com/${part1}-${part2}-${part3}`;
};

// GET all meetings (for Admin)
router.get("/", async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ date: 1, time: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

// POST schedule a meeting
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, date, time } = req.body;

    if (!name || !email || !date || !time) {
      return res.status(400).json({ error: "Name, email, date, and time are required" });
    }

    const meetLink = generateGoogleMeetLink();

    const newMeeting = new Meeting({
      name,
      email,
      subject: subject || "Portfolio Project Discussion",
      date,
      time,
      meetLink,
    });

    await newMeeting.save();

    // Send email confirmation (non-blocking)
    sendMeetingEmail(newMeeting).catch((err) => {
      console.error("Nodemailer meeting error:", err);
    });

    res.status(201).json({ success: true, meeting: newMeeting });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({ error: "Failed to schedule meeting" });
  }
});

// PUT update meeting status (confirm, complete, cancel)
router.put("/:id", async (req, res) => {
  try {
    const { status, date, time } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (date) updateData.date = date;
    if (time) updateData.time = time;

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json({ success: true, meeting: updatedMeeting });
  } catch (error) {
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

// DELETE cancel/remove meeting record
router.delete("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Meeting cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel meeting" });
  }
});

export default router;
