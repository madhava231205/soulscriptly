
import express from 'express'
import prisma from '../lib/prisma.js'
import authenticateToken from '../middleware/auth.middleware.js'
import bcrypt from 'bcrypt'

const router = express.Router()

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


export default router;


