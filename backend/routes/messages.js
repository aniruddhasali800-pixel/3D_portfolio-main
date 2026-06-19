import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Message from "../models/Message.js";
import { sendNotificationEmail, sendReplyEmail } from "../utils/emailService.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "backend", "data", "uploads");
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
    const messages = await Message.find().sort({ createdAt: -1 });
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

    const newMessage = new Message({
      name,
      email,
      message,
      attachments,
    });

    await newMessage.save();

    // Send email notification to admin (in background, don't block response)
    sendNotificationEmail(newMessage).catch((err) => {
      console.error("Nodemailer error:", err);
    });

    res.status(201).json({ success: true, message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// PUT mark message as read
router.put("/:id/read", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
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

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Save reply in database
    message.replies.push({
      body,
      repliedAt: Date.now(),
    });
    await message.save();

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
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Delete attachments files
    for (const att of message.attachments) {
      if (fs.existsSync(att.path)) {
        fs.unlinkSync(att.path);
      }
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
