import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Project from "../models/Project.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "backend", "data", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// GET all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST create project
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No icon file uploaded" });
    }

    const { name, description, link, theme, githubLink } = req.body;

    // Use relative path for iconUrl so it works via proxy
    const iconUrl = `/api/uploads/${req.file.filename}`;

    const newProject = new Project({
      name,
      description,
      link,
      theme: theme || "btn-back-blue",
      iconUrl,
      filename: req.file.filename,
      githubLink: githubLink || "",
    });

    await newProject.save();
    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PUT update project
router.put("/:id", async (req, res) => {
  try {
    const { link, githubLink } = req.body;
    const updateData = {};
    if (link !== undefined) updateData.link = link;
    if (githubLink !== undefined) updateData.githubLink = githubLink;
    updateData.updatedAt = Date.now();

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, project: updatedProject });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete associated upload file
    if (project.filename) {
      const filePath = path.join(uploadDir, project.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
