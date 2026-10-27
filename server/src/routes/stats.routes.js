
import express from "express";
import authenticateToken from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [notes, diaryEntries, memories] = await Promise.all([
      prisma.note.count({
        where: { userId },
      }),

      prisma.diaryEntry.count({
        where: { userId },
      }),

      prisma.diaryPhoto.count({
        where: {
          diaryEntry: {
            userId,
          },
        },
      }),
    ]);

    res.json({
      status: "OK",
      stats: {
        notes,
        diaryEntries,
        memories,
      },
    });
  } catch (error) {
    console.error("Error fetching writing statistics:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Could not fetch writing statistics.",
    });
  }
});

export default router;
