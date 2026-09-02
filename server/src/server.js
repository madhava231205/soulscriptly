import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/note.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to SoulScriptly API 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SoulScriptly backend is running",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json({
      status: "OK",
      database: "connected",
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});


app.listen(PORT, () => {
  console.log(
    `🚀 SoulScriptly server running on http://localhost:${PORT}`
  );
});