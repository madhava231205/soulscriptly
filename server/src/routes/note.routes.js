import express from "express";
import authenticateToken from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        status: "ERROR",
        message: "Title and content are required",
      });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      status: "OK",
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});

export default router;