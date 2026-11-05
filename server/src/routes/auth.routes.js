import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileTypeFromFile } from "file-type";
import { sendEmail } from "../utils/email.js";
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  canResendOtp,
} from "../utils/otp.js";
import crypto from "crypto";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        status: "ERROR",
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        status: "ERROR",
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "ERROR",
        message: "An account with this email already exists",
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpExpiresAt = getOtpExpiry();

    await prisma.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name.trim(),
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpSentAt: new Date(),
      },
      create: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
      },
    });

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your SoulScriptly verification code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to SoulScriptly!</h2>
            <p>Use this code to verify your email address:</p>
            <h1 style="letter-spacing: 8px;">${otp}</h1>
            <p>This code expires in 5 minutes.</p>
            <p>If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      await prisma.pendingRegistration.deleteMany({
        where: { email: normalizedEmail },
      });

      throw emailError;
    }

    return res.status(200).json({
      status: "OK",
      message: "Verification code sent to your email",
      requiresOtpVerification: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Registration OTP error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Could not start registration. Please try again.",
    });
  }
});
router.post("/verify-registration-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({
        status: "ERROR",
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please enter a valid 6-digit OTP",
      });
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      return res.status(404).json({
        status: "ERROR",
        message: "Registration not found. Please register again.",
      });
    }

    if (pending.otpExpiresAt <= new Date()) {
      await prisma.pendingRegistration.delete({
        where: { email: normalizedEmail },
      });

      return res.status(400).json({
        status: "ERROR",
        message: "OTP has expired. Please register again.",
      });
    }

    if (pending.otpAttempts >= 5) {
      await prisma.pendingRegistration.delete({
        where: { email: normalizedEmail },
      });

      return res.status(429).json({
        status: "ERROR",
        message: "Too many incorrect attempts. Please register again.",
      });
    }

    const submittedHash = Buffer.from(hashOtp(String(otp)), "hex");
    const storedHash = Buffer.from(pending.otpHash, "hex");

    const isValidOtp =
      submittedHash.length === storedHash.length &&
      crypto.timingSafeEqual(submittedHash, storedHash);

    if (!isValidOtp) {
      const updated = await prisma.pendingRegistration.update({
        where: { email: normalizedEmail },
        data: { otpAttempts: { increment: 1 } },
      });

      if (updated.otpAttempts >= 5) {
        await prisma.pendingRegistration.deleteMany({
          where: { email: normalizedEmail },
        });
      }

      return res.status(400).json({
        status: "ERROR",
        message: "Incorrect OTP",
        attemptsRemaining: Math.max(0, 5 - updated.otpAttempts),
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new Error("ACCOUNT_ALREADY_EXISTS");
      }

      const createdUser = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          password: pending.password,
        },
      });

      await tx.pendingRegistration.delete({
        where: { email: normalizedEmail },
      });

      return createdUser;
    });

    const {
      password: _,
      ...userWithoutPassword
    } = user;

    return res.status(201).json({
      status: "OK",
      message: "Email verified and account created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error.message === "ACCOUNT_ALREADY_EXISTS") {
      return res.status(409).json({
        status: "ERROR",
        message: "An account with this email already exists",
      });
    }

    console.error("Registration OTP verification error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Could not verify OTP. Please try again.",
    });
  }
});
router.post("/resend-registration-otp", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        status: "ERROR",
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      return res.status(404).json({
        status: "ERROR",
        message: "Pending registration not found. Please register again.",
      });
    }

    if (!canResendOtp(pending.otpSentAt)) {
      return res.status(429).json({
        status: "ERROR",
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOtp();

    await prisma.pendingRegistration.update({
      where: { email: normalizedEmail },
      data: {
        otpHash: hashOtp(otp),
        otpExpiresAt: getOtpExpiry(),
        otpAttempts: 0,
        otpSentAt: new Date(),
      },
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Your new SoulScriptly verification code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>SoulScriptly email verification</h2>
          <p>Your new verification code is:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    });

    return res.json({
      status: "OK",
      message: "A new verification code has been sent",
    });
  } catch (error) {
    console.error("Resend registration OTP error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Could not resend OTP. Please try again.",
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        status: "ERROR",
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Use the same response whether the account exists or not.
    if (!user) {
      return res.status(200).json({
        status: "OK",
        message: "If an account exists, a reset code will be sent.",
      });
    }

    const otp = generateOtp();

    await prisma.passwordReset.upsert({
      where: { email },
      update: {
        otpHash: hashOtp(otp),
        otpExpiresAt: getOtpExpiry(),
        otpAttempts: 0,
        otpSentAt: new Date(),
      },
      create: {
        email,
        otpHash: hashOtp(otp),
        otpExpiresAt: getOtpExpiry(),
      },
    });

    await sendEmail({
      to: email,
      subject: "SoulScriptly Password Reset Code",
      html: `
        <h2>Password Reset</h2>
        <p>Your SoulScriptly password reset code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });

    return res.status(200).json({
      status: "OK",
      message: "If an account exists, a reset code will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Unable to process your request right now.",
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
        profilePicture: true,
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