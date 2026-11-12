
import express from 'express'
import prisma from '../lib/prisma.js'
import authenticateToken from '../middleware/auth.middleware.js'
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileTypeFromFile } from 'file-type'
import { sendEmail } from "../utils/email.js";
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  canResendOtp,
} from "../utils/otp.js";
import crypto from "crypto";

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'src', 'uploads')

fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }

    cb(null, true)
  },
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body || {}

    if (!title || !content) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Title and content are required',
      })
    }

    const diaryEntry = await prisma.diaryEntry.create({
      data: {
        title,
        content,
        userId: req.user.userId,
      },
    })

    res.status(201).json({
      status: 'OK',
      message: 'Diary entry created successfully',
      diaryEntry,
    })
  } catch (error) {
    console.error('Create diary entry error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})


router.get('/', authenticateToken, async (req, res) => {
  try {
    const diaryEntries = await prisma.diaryEntry.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      status: 'OK',
      diaryEntries,
    })
  } catch (error) {
    console.error('Get diary entries error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})

router.get('/pin-status', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        diaryPinHash: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
      })
    }

    res.json({
      status: 'OK',
      hasPin: Boolean(user.diaryPinHash),
    })
  } catch (error) {
    console.error('Get diary PIN status error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})
router.post(
  '/handwriting',
  authenticateToken,
  async (req, res) => {
    try {
      const { character, imageData } = req.body || {}

      if (!character || !imageData) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Character and image data are required',
        })
      }

      if (
  typeof character !== 'string' ||
  Array.from(character).length !== 1 ||
  character.trim() === ''
) {
  return res.status(400).json({
    status: 'ERROR',
    message: 'Please provide one valid character',
  })
}

      if (
        typeof imageData !== 'string' ||
        !imageData.startsWith('data:image/png;base64,')
      ) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'A valid PNG image is required',
        })
      }

      const sample = await prisma.handwritingSample.upsert({
        where: {
          userId_character: {
            userId: req.user.userId,
            character,
          },
        },
        update: {
          imageData,
        },
        create: {
          character,
          imageData,
          userId: req.user.userId,
        },
      })

      return res.status(201).json({
        status: 'OK',
        message: 'Handwriting sample saved successfully',
        sample: {
          id: sample.id,
          character: sample.character,
          createdAt: sample.createdAt,
          updatedAt: sample.updatedAt,
        },
      })
    } catch (error) {
      console.error('Save handwriting sample error:', error)

      return res.status(500).json({
        status: 'ERROR',
        message: 'Unable to save handwriting sample',
      })
    }
  }
)


router.get('/handwriting', authenticateToken, async (req, res) => {
  try {
    const samples = await prisma.handwritingSample.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        character: 'asc',
      },
    })

    res.json({
      status: 'OK',
      samples,
    })
  } catch (error) {
    console.error('Get handwriting samples error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Unable to retrieve handwriting samples',
    })
  }
})


router.get('/:id/photos', authenticateToken, async (req, res) => {
  try {
    const diaryId = Number(req.params.id)

    if (!Number.isInteger(diaryId) || diaryId <= 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid diary entry ID',
      })
    }

    const diaryEntry = await prisma.diaryEntry.findFirst({
      where: {
        id: diaryId,
        userId: req.user.userId,
      },
    })

    if (!diaryEntry) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Diary entry not found',
      })
    }

    const photos = await prisma.diaryPhoto.findMany({
      where: {
        diaryEntryId: diaryId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return res.json({
      status: 'OK',
      photos,
    })
  } catch (error) {
    console.error('Get diary photos error:', error)

    return res.status(500).json({
      status: 'ERROR',
      message: 'Unable to retrieve diary photos',
    })
  }
})



router.get('/photos/:photoId/image', authenticateToken, async (req, res) => {
  try {
    const photoId = Number(req.params.photoId)

    if (!Number.isInteger(photoId) || photoId <= 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid photo ID',
      })
    }

    const photo = await prisma.diaryPhoto.findFirst({
      where: {
        id: photoId,
        diaryEntry: {
          userId: req.user.userId,
        },
      },
    })

    if (!photo) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Photo not found',
      })
    }

    const filename = path.basename(photo.imageUrl)
    const imagePath = path.join(process.cwd(), 'src', 'uploads', filename)

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Image file not found',
      })
    }

    return res.sendFile(imagePath)
  } catch (error) {
    console.error('Get private diary photo error:', error)

    return res.status(500).json({
      status: 'ERROR',
      message: 'Unable to retrieve photo',
    })
  }
})

router.delete('/photos/:photoId', authenticateToken, async (req, res) => {
  try {
    const photoId = Number(req.params.photoId)

    if (!Number.isInteger(photoId) || photoId <= 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid photo ID',
      })
    }

    const photo = await prisma.diaryPhoto.findFirst({
      where: {
        id: photoId,
        diaryEntry: {
          userId: req.user.userId,
        },
      },
    })

    if (!photo) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Photo not found',
      })
    }

    await prisma.diaryPhoto.delete({
      where: { id: photoId },
    })

    return res.json({
      status: 'SUCCESS',
      message: 'Photo deleted successfully',
    })
  } catch (error) {
    console.error('Delete diary photo error:', error)

    return res.status(500).json({
      status: 'ERROR',
      message: 'Unable to delete photo',
    })
  }
})

router.post(
  '/:id/photos',
  authenticateToken,
  upload.single('photo'),
  async (req, res) => {
    let savedFilePath

    try {
      const diaryId = Number(req.params.id)

      if (!Number.isInteger(diaryId) || diaryId <= 0) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Invalid diary entry ID',
        })
      }

      if (!req.file) {
  return res.status(400).json({
    status: 'ERROR',
    message: 'Photo file is required',
  })
}

savedFilePath = req.file.path

const detectedType = await fileTypeFromFile(savedFilePath)
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
  fs.unlinkSync(savedFilePath)
  savedFilePath = undefined

  return res.status(400).json({
    status: 'ERROR',
    message: 'Only valid JPG, PNG, and WebP images are allowed',
  })
}

      const diaryEntry = await prisma.diaryEntry.findFirst({
        where: {
          id: diaryId,
          userId: req.user.userId,
        },
      })

      if (!diaryEntry) {
        fs.unlinkSync(savedFilePath)

        return res.status(404).json({
          status: 'ERROR',
          message: 'Diary entry not found',
        })
      }

      const photo = await prisma.diaryPhoto.create({
        data: {
          imageUrl: `/uploads/${req.file.filename}`,
          diaryEntryId: diaryId,
        },
      })

      return res.status(201).json({
        status: 'OK',
        message: 'Photo uploaded successfully',
        photo,
      })
    } catch (error) {
      if (savedFilePath && fs.existsSync(savedFilePath)) {
        fs.unlinkSync(savedFilePath)
      }

      console.error('Upload diary photo error:', error)

      return res.status(500).json({
        status: 'ERROR',
        message: 'Unable to upload photo',
      })
    }
  }
)


router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const diaryId = Number(req.params.id)

    const diaryEntry = await prisma.diaryEntry.findFirst({
      where: {
        id: diaryId,
        userId: req.user.userId,
      },
    })

    if (!diaryEntry) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Diary entry not found',
      })
    }

    res.json({
      status: 'OK',
      diaryEntry,
    })
  } catch (error) {
    console.error('Get diary entry error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})


router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const diaryId = Number(req.params.id)
    const { title, content } = req.body || {}

    if (!title || !content) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Title and content are required',
      })
    }

    const existingEntry = await prisma.diaryEntry.findFirst({
      where: {
        id: diaryId,
        userId: req.user.userId,
      },
    })

    if (!existingEntry) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Diary entry not found',
      })
    }

    const updatedEntry = await prisma.diaryEntry.update({
      where: {
        id: diaryId,
      },
      data: {
        title,
        content,
      },
    })

    res.json({
      status: 'OK',
      message: 'Diary entry updated successfully',
      diaryEntry: updatedEntry,
    })
  } catch (error) {
    console.error('Update diary entry error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})


router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const diaryId = Number(req.params.id)

    const existingEntry = await prisma.diaryEntry.findFirst({
      where: {
        id: diaryId,
        userId: req.user.userId,
      },
    })

    if (!existingEntry) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Diary entry not found',
      })
    }

    await prisma.diaryEntry.delete({
      where: {
        id: diaryId,
      },
    })

    res.json({
      status: 'OK',
      message: 'Diary entry deleted successfully',
    })
  } catch (error) {
    console.error('Delete diary entry error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})

router.post('/pin', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body || {}

    if (!pin) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'PIN is required',
      })
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'PIN must be exactly 4 digits',
      })
    }

    const hashedPin = await bcrypt.hash(pin, 10)

    await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        diaryPinHash: hashedPin,
      },
    })

    res.json({
      status: 'OK',
      message: 'Diary PIN created successfully',
    })
  } catch (error) {
    console.error('Create diary PIN error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})

router.post('/unlock', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body || {}

    if (!pin) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'PIN is required',
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        diaryPinHash: true,
      },
    })

    if (!user || !user.diaryPinHash) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Diary PIN has not been set yet',
      })
    }

    const isCorrect = await bcrypt.compare(
      pin,
      user.diaryPinHash
    )

    if (!isCorrect) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Incorrect Diary PIN',
      })
    }

    res.json({
      status: 'OK',
      message: 'Diary unlocked successfully',
    })
  } catch (error) {
    console.error('Unlock diary error:', error)

    res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong',
    })
  }
})


router.post("/pin-reset/send-otp", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
      });
    }

    const existingRequest = await prisma.diaryPinReset.findUnique({
      where: { userId: user.id },
    });

    if (existingRequest && !canResendOtp(existingRequest.otpSentAt)) {
      return res.status(429).json({
        status: "ERROR",
        message: "Please wait before requesting another OTP",
      });
    }

    const otp = generateOtp();

    await prisma.diaryPinReset.upsert({
      where: { userId: user.id },
      update: {
        otpHash: hashOtp(otp),
        otpExpiresAt: getOtpExpiry(),
        otpAttempts: 0,
        otpSentAt: new Date(),
        verifiedAt: null,
      },
      create: {
        userId: user.id,
        otpHash: hashOtp(otp),
        otpExpiresAt: getOtpExpiry(),
      },
    });

    await sendEmail({
      to: user.email,
      subject: "SoulScriptly - Diary PIN Reset OTP",
      html: `<h2>Your Diary PIN reset code is ${otp}</h2>
             <p>This code expires in 5 minutes.</p>`,
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "OTP sent to your registered email",
    });
  } catch (error) {
    console.error("Diary PIN reset OTP error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Could not send verification code",
    });
  }
});

router.post("/pin-reset/verify-otp", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please enter a valid 6-digit OTP",
      });
    }

    const request = await prisma.diaryPinReset.findUnique({
      where: { userId: req.user.userId },
    });

    if (!request) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please request an OTP first",
      });
    }

    if (request.otpExpiresAt < new Date()) {
      return res.status(400).json({
        status: "ERROR",
        message: "OTP has expired. Please request a new one",
      });
    }

    if (request.otpAttempts >= 5) {
      return res.status(429).json({
        status: "ERROR",
        message: "Too many incorrect attempts. Please request a new OTP",
      });
    }

    const submittedHash = hashOtp(otp);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(request.otpHash, "hex")
    );

    if (!isValid) {
      await prisma.diaryPinReset.update({
        where: { userId: req.user.userId },
        data: { otpAttempts: { increment: 1 } },
      });

      return res.status(400).json({
        status: "ERROR",
        message: "Incorrect OTP",
      });
    }

    await prisma.diaryPinReset.update({
      where: { userId: req.user.userId },
      data: { verifiedAt: new Date() },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Diary PIN OTP verification error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "OTP verification failed",
    });
  }
});
// Update Diary PIN after OTP verification
router.post("/pin-reset/update", authenticateToken, async (req, res) => {
  try {
    const { newPin } = req.body;

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        status: "ERROR",
        message: "New PIN must be exactly 4 digits",
      });
    }

    const request = await prisma.diaryPinReset.findUnique({
      where: { userId: req.user.userId },
    });

    if (!request || !request.verifiedAt) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please verify your OTP first",
      });
    }

    if (request.otpExpiresAt < new Date()) {
      return res.status(400).json({
        status: "ERROR",
        message: "Verification has expired. Please request a new OTP",
      });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.userId },
        data: { diaryPinHash: hashedPin },
      }),
      prisma.diaryPinReset.delete({
        where: { userId: req.user.userId },
      }),
    ]);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Diary PIN reset successfully",
    });
  } catch (error) {
    console.error("Diary PIN reset update error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "Could not reset Diary PIN",
    });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Photo must be 5 MB or smaller'
        : 'Unable to upload photo'

    return res.status(400).json({
      status: 'ERROR',
      message,
    })
  }

  if (err) {
    return res.status(400).json({
      status: 'ERROR',
      message: err.message || 'Invalid photo upload',
    })
  }

  next()
})


export default router;


