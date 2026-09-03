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

router.get("/", authenticateToken, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      status: "OK",
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const noteId = Number(req.params.id);

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.user.userId,
      },
    });

    if (!note) {
      return res.status(404).json({
        status: "ERROR",
        message: "Note not found",
      });
    }

    res.json({
      status: "OK",
      note,
    });
  } catch (error) {
    console.error("Get note error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    const { title, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        status: "ERROR",
        message: "Title and content are required",
      });
    }

    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.user.userId,
      },
    });

    if (!existingNote) {
      return res.status(404).json({
        status: "ERROR",
        message: "Note not found",
      });
    }

    const updatedNote = await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        title,
        content,
      },
    });

    res.json({
      status: "OK",
      message: "Note updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    console.error("Update note error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const noteId = Number(req.params.id);

    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: req.user.userId,
      },
    });

    if (!existingNote) {
      return res.status(404).json({
        status: "ERROR",
        message: "Note not found",
      });
    }

    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    res.json({
      status: "OK",
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});

export default router;