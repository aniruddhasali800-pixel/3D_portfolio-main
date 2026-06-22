import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import { jsonDb } from "../utils/jsonDb.js";
import { sendNotificationEmail, sendReplyEmail } from "../utils/emailService.js";

const router = express.Router();

// Ensure upload directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "data", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// GET all messages (for Admin)
router.get("/", async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let messages;
    if (isDbConnected) {
      messages = await Message.find().sort({ createdAt: -1 });
    } else {
      messages = jsonDb.find("messages").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST send message (Contact form)
router.post("/", upload.array("attachments", 5), async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required fields" });
    }

    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
    }));

    const isDbConnected = mongoose.connection.readyState === 1;
    let savedMessage;

    if (isDbConnected) {
      const newMessage = new Message({
        name,
        email,
        message,
        attachments,
      });
      savedMessage = await newMessage.save();
    } else {
      console.log("⚠️ MongoDB is offline. Saving message to JSON database.");
      savedMessage = jsonDb.insert("messages", {
        name,
        email,
        message,
        attachments,
        isRead: false,
        replies: [],
      });
    }

    // Send email notification to admin (in background, don't block response)
    sendNotificationEmail(savedMessage).catch((err) => {
      console.error("Nodemailer error:", err);
    });

    res.status(201).json({ success: true, message: "Message sent successfully", data: savedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// PUT mark message as read
router.put("/:id/read", async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    let message;

    if (isDbConnected && isValidObjectId) {
      message = await Message.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
    } else {
      message = jsonDb.findByIdAndUpdate("messages", req.params.id, { isRead: true });
    }

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

// POST reply to message
router.post("/:id/reply", async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!body) {
      return res.status(400).json({ error: "Reply body is required" });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    let message;

    if (isDbConnected && isValidObjectId) {
      message = await Message.findById(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      message.replies.push({
        body,
        repliedAt: Date.now(),
      });
      await message.save();
    } else {
      message = jsonDb.findById("messages", req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      if (!message.replies) message.replies = [];
      message.replies.push({
        body,
        repliedAt: new Date().toISOString(),
      });
      message = jsonDb.findByIdAndUpdate("messages", req.params.id, { replies: message.replies });
    }

    // Send reply via email
    await sendReplyEmail(message.email, subject || `Reply to your message: "${message.message.substring(0, 30)}..."`, body);

    res.json({ success: true, message: "Reply sent successfully", data: message });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
});

// DELETE message
router.delete("/:id", async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    let message;

    if (isDbConnected && isValidObjectId) {
      message = await Message.findById(req.params.id);
    } else {
      message = jsonDb.findById("messages", req.params.id);
    }

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Delete attachments files
    if (message.attachments && Array.isArray(message.attachments)) {
      for (const att of message.attachments) {
        if (att && att.path && fs.existsSync(att.path)) {
          fs.unlinkSync(att.path);
        }
      }
    }

    if (isDbConnected && isValidObjectId) {
      await Message.findByIdAndDelete(req.params.id);
    } else {
      jsonDb.findByIdAndDelete("messages", req.params.id);
    }

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;

