
import express from 'express'
import prisma from '../lib/prisma.js'
import authenticateToken from '../middleware/auth.middleware.js'

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

export default router;


