import express from "express";
import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import { jsonDb } from "../utils/jsonDb.js";
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
    const isDbConnected = mongoose.connection.readyState === 1;
    let meetings;
    if (isDbConnected) {
      meetings = await Meeting.find().sort({ date: 1, time: 1 });
    } else {
      meetings = jsonDb.find("meetings").sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    }
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
    const isDbConnected = mongoose.connection.readyState === 1;
    let newMeeting;

    if (isDbConnected) {
      const meeting = new Meeting({
        name,
        email,
        subject: subject || "Portfolio Project Discussion",
        date,
        time,
        meetLink,
      });
      newMeeting = await meeting.save();
    } else {
      console.log("⚠️ MongoDB is offline. Saving meeting to JSON database.");
      newMeeting = jsonDb.insert("meetings", {
        name,
        email,
        subject: subject || "Portfolio Project Discussion",
        date,
        time,
        meetLink,
        status: "pending",
      });
    }

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

    const isDbConnected = mongoose.connection.readyState === 1;
    let updatedMeeting;

    if (isDbConnected) {
      updatedMeeting = await Meeting.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
    } else {
      updatedMeeting = jsonDb.findByIdAndUpdate("meetings", req.params.id, updateData);
    }

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
    const isDbConnected = mongoose.connection.readyState === 1;
    let meeting;

    if (isDbConnected) {
      meeting = await Meeting.findById(req.params.id);
    } else {
      meeting = jsonDb.findById("meetings", req.params.id);
    }

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (isDbConnected) {
      await Meeting.findByIdAndDelete(req.params.id);
    } else {
      jsonDb.findByIdAndDelete("meetings", req.params.id);
    }

    res.json({ success: true, message: "Meeting cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel meeting" });
  }
});

export default router;

