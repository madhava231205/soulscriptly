import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "ERROR",
        message: "NOTE: All fields are required fill",
      });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "ERROR",
        message: "User with this email already exists",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 5. Don't send password back to the client
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      status: "OK",
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});
//login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        status: "ERROR",
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "ERROR",
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        status: "ERROR",
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

    res.json({
      status: "OK",
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
});

router.get("/protected", authenticateToken, (req, res) => {
  res.json({
    status: "OK",
    message: "You have access to this protected route",
    user: req.user,
  });
});
export default router;