import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileTypeFromFile } from "file-type";

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
        profilePicture: user.profilePicture,
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

router.get("/protected", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profilePicture: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
      })
    }

    res.json({
      status: "OK",
      message: "You are authenticated",
      user,
    })
  } catch (error) {
    console.error("Protected route error:", error)

    res.status(500).json({
      status: "ERROR",
      message: "Something went wrong",
    })
  }
});

const uploadDir = path.join(process.cwd(), "src", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.patch("/profile", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "ERROR",
        message: "Name is required",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json({
      status: "OK",
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Could not update profile",
    });
  }
});

router.patch(
  "/profile/picture",
  authenticateToken,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, (error) => {
      if (error) {
        console.error("Profile picture upload middleware error:", error);
        return res.status(400).json({
          status: "ERROR",
          message: error.message || "Picture upload failed",
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      console.log("Profile picture route reached");
      if (!req.file) {
        return res.status(400).json({
          status: "ERROR",
          message: "Please select an image",
        });
      }

      console.log("Profile picture uploaded:", req.file.path);
      // Verify the actual file type, not just its extension or MIME type
      const fileType = await fileTypeFromFile(req.file.path);

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!fileType || !allowedTypes.includes(fileType.mime)) {
        await fs.promises.unlink(req.file.path);

        return res.status(400).json({
          status: "ERROR",
          message: "Only JPEG, PNG, and WebP images are allowed",
        });
      }
console.log("Image verified. Saving profile picture to database...");
      const user = await prisma.user.update({
        where: {
          id: req.user.userId,
        },
        data: {
          profilePicture: `/uploads/${req.file.filename}`,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          profilePicture: true,
        },
      });

      res.json({
        status: "OK",
        message: "Profile picture updated successfully",
        user,
      });
    } catch (error) {
      // Remove the uploaded file if saving fails
      if (req.file) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }

      console.error("Profile picture update error:", error);

      res.status(500).json({
        status: "ERROR",
        message: "Could not update profile picture",
      });
    }
  }
);

router.get("/profile/picture/image", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { profilePicture: true },
    });

    if (!user?.profilePicture) {
      return res.status(404).json({
        status: "ERROR",
        message: "No profile picture found",
      });
    }

    const filename = path.basename(user.profilePicture);
    const imagePath = path.join(uploadDir, filename);

    res.sendFile(imagePath, (error) => {
      if (error && !res.headersSent) {
        res.status(error.statusCode === 404 ? 404 : 500).end();
      }
    });
  } catch (error) {
    console.error("Profile picture retrieval error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        status: "ERROR",
        message: "Could not retrieve profile picture",
      });
    }
  }
});
export default router;