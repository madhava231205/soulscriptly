import { useEffect, useState } from 'react'
import HandwritingRenderer from './HandwritingRenderer'
import { jsPDF } from 'jspdf';
import {API_BASE_URL} from "../api";

function DiaryPage() {
  const [diaryEntries, setDiaryEntries] = useState([])
  const [handwritingSamples, setHandwritingSamples] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
   const [Message, setMessage] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
const [selectedDate, setSelectedDate] = useState(null)
const [title, setTitle] = useState('')
const [content, setContent] = useState('')
const [saving, setSaving] = useState(false)
const [selectedEntry, setSelectedEntry] = useState(null)
const [editingEntry, setEditingEntry] = useState(null)
const [isDiaryUnlocked, setIsDiaryUnlocked] = useState(false)
const [hasDiaryPin, setHasDiaryPin] = useState(null)
const [enteredPin, setEnteredPin] = useState('')
const [pinError, setPinError] = useState('')
const [newPin, setNewPin] = useState('')
const [confirmPin, setConfirmPin] = useState('')
const [pinSaving, setPinSaving] = useState(false)
 const [diaryPhotos, setDiaryPhotos] = useState([])
 const [editingPhotos, setEditingPhotos] = useState([])
const [photoImages, setPhotoImages] = useState({})
const [activePhotoIndex, setActivePhotoIndex] = useState(null)
const [touchStartX, setTouchStartX] = useState(null)
const [selectedPhotos, setSelectedPhotos] = useState([])
const [exportingPDF, setExportingPDF] = useState(false)

const calendarYear = calendarMonth.getFullYear()
const calendarMonthIndex = calendarMonth.getMonth()
const [searchQuery, setSearchQuery] = useState('')

const firstDayOfMonth = new Date(
  calendarYear,
  calendarMonthIndex,
  1
).getDay()

const daysInMonth = new Date(
  calendarYear,
  calendarMonthIndex + 1,
  0
).getDate()


const filteredDiaryEntries = diaryEntries.filter((entry) => {
  // Keep the existing calendar date filter
  if (selectedDate) {
    const entryDate = new Date(entry.createdAt)

    const matchesDate =
      entryDate.getFullYear() === selectedDate.getFullYear() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getDate() === selectedDate.getDate()

    if (!matchesDate) return false
  }

  // Search both title and content
  const query = searchQuery.trim().toLowerCase()

  if (!query) return true

  return (
    entry.title.toLowerCase().includes(query) ||
    entry.content.toLowerCase().includes(query)
  )
})


useEffect(() => {
  if (activePhotoIndex === null) return

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      setActivePhotoIndex((current) =>
        current > 0 ? current - 1 : current
      )
    }

    if (event.key === 'ArrowRight') {
      setActivePhotoIndex((current) =>
        current < diaryPhotos.length - 1
          ? current + 1
          : current
      )
    }

    if (event.key === 'Escape') {
      setActivePhotoIndex(null)
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}, [activePhotoIndex, diaryPhotos.length])

useEffect(() => {
  let cancelled = false
  const objectUrls = []

  const loadPhotoImages = async () => {
    const token = localStorage.getItem('token')

    if (!token || diaryPhotos.length === 0) {
      setPhotoImages({})
      return
    }

    const loadedImages = {}

    try {
      await Promise.all(
        diaryPhotos.map(async (photo) => {
          const response = await fetch(
            `${API_BASE_URL}/api/diary/photos/${photo.id}/image`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          if (!response.ok) {
            throw new Error(`Could not load photo ${photo.id}`)
          }

          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)

          objectUrls.push(objectUrl)
          loadedImages[photo.id] = objectUrl
        })
      )

      if (!cancelled) {
        setPhotoImages(loadedImages)
      }
    } catch (error) {
      console.error('Load diary images error:', error)

      objectUrls.forEach((url) => URL.revokeObjectURL(url))

      if (!cancelled) {
        setPhotoImages({})
      }
    }
  }

  loadPhotoImages()

  return () => {
    cancelled = true
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
  }
}, [diaryPhotos])


async function getHandwritingSamples() {
  const token = localStorage.getItem('token')

  if (!token) {
    return
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/handwriting`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (response.ok) {
      
      const datasamples = {}

      for (const sample of data.samples) {
        datasamples[sample.character] = sample.imageData
      }

      setHandwritingSamples(datasamples)
    }
  } catch (error) {
    console.error('Get handwriting samples error:', error)
  }
}

async function getDiaryEntries() {
    const token = localStorage.getItem('token')

    if (!token) {
      setError('Please login first.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/diary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setDiaryEntries(data.diaryEntries)
      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Get diary entries error:', error)
      setError('Unable to load diary entries.')
    } finally {
      setLoading(false)
    }
  }

  
const getDiaryPhotos = async (diaryId) => {
  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      `${API_BASE_URL}/api/diary/${diaryId}/photos`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (response.ok) {
      
      setDiaryPhotos(data.photos || [])
return data.photos || []
    } else {
      setDiaryPhotos([])
      console.error('Unable to load diary photos:', data.message)
    }
  } catch (error) {
    setDiaryPhotos([])
    console.error('Get diary photos error:', error)
  }
}

const loadHandwritingImage = (imageData) => {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(
      new Error('Unable to load handwriting sample')
    )

    image.src = imageData
  })
}

async function exportDiaryEntryPDF() {
  if (!selectedEntry) return

  setExportingPDF(true)
  const token = localStorage.getItem('token')

  try {
    const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
})

const pageWidth = pdf.internal.pageSize.getWidth()
const pageHeight = pdf.internal.pageSize.getHeight()

const marginLeft = 15
const marginRight = 15
const marginTop = 15
const marginBottom = 15

const contentWidth = pageWidth - marginLeft - marginRight
const contentHeight = pageHeight - marginTop - marginBottom

pdf.setFont('helvetica', 'bold')
pdf.setFontSize(22)
pdf.setFillColor("#5648c7")

pdf.text(
  selectedEntry.title,
  marginLeft,
  marginTop + 5,
  { maxWidth: contentWidth },
  {color : '#5648c7'},
)

pdf.setFont('helvetica', 'normal')
pdf.setFontSize(10)

const entryDate = new Date(selectedEntry.createdAt).toLocaleDateString(
  'en-GB',
  {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
)

pdf.text(
  `Created on ${entryDate}`,
  marginLeft,
  marginTop + 13
)
const exportCanvas = document.createElement('canvas')
const exportContext = exportCanvas.getContext('2d')

if (!exportContext) {
  throw new Error('Unable to create export canvas')
}

const canvasWidth = 800
const maxLetterWidth = 20
const letterHeight = 30
const spacing = 3
const spaceWidth = 20
const lineHeight = 42
const leftMargin = 10
const rightMargin = 10
const topMargin = 20
const bottomMargin = 20
const canvasPageHeight = 1122
const handwritingImages = {}

await Promise.all(
  Object.entries(handwritingSamples).map(async ([character, imageData]) => {
    try {
      handwritingImages[character] = await loadHandwritingImage(imageData)
    } catch (error) {
      console.warn(`Could not load handwriting sample: ${character}`, error)
    }
  })
)
const getCharacters = (value) =>
  typeof Intl.Segmenter !== 'undefined'
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
        .map((item) => item.segment)
    : Array.from(value)
const drawRuledLines = (context, height) => {
  context.strokeStyle = 'rgba(130, 120, 175, 0.38)'
  context.lineWidth = 1

  for (let y = topMargin + 28; y < height - bottomMargin; y += lineHeight) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(canvasWidth, y)
    context.stroke()
  }
}
const drawHandwrittenCharacter = (context, character, x, y, textLength) => {
  const image = handwritingImages[character]

 if (!image) {
  const isEmoji = /[\p{Extended_Pictographic}\uFE0F\u20E3]/u.test(character)

  context.save()

  if (isEmoji) {
    context.font = '24px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  } else {
    context.font = '24px Arial, sans-serif'
    context.fillStyle = '#333333'
  }

  context.textBaseline = 'alphabetic'
  context.fillText(character, x, y + letterHeight)

  const characterWidth = context.measureText(character).width

  context.restore()

  return Math.max(characterWidth, maxLetterWidth) + spacing
}

  const aspectRatio = image.width / image.height
  const drawHeight = letterHeight
  const drawWidth = Math.min(maxLetterWidth, drawHeight * aspectRatio)

  const heightVariation =
    0.97 + ((character.charCodeAt(0) * (textLength + 1)) % 7) / 100

  const verticalOffset =
    ((character.charCodeAt(0) * 3) % 5) - 2

  const letterCanvas = document.createElement('canvas')
  letterCanvas.width = Math.max(1, Math.ceil(drawWidth))
  letterCanvas.height = drawHeight

  const letterContext = letterCanvas.getContext('2d')

  if (!letterContext) {
    return drawWidth + spacing
  }

  letterContext.drawImage(
    image,
    0,
    0,
    letterCanvas.width,
    letterCanvas.height
  )

  const imageData = letterContext.getImageData(
    0,
    0,
    letterCanvas.width,
    letterCanvas.height
  )

  const pixels = imageData.data
  const originalPixels = new Uint8ClampedArray(pixels)

  for (let py = 0; py < letterCanvas.height; py++) {
    for (let px = 0; px < letterCanvas.width; px++) {
      const index = (py * letterCanvas.width + px) * 4

      if (originalPixels[index + 3] !== 0) continue

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx
          const ny = py + dy

          if (
            nx < 0 ||
            ny < 0 ||
            nx >= letterCanvas.width ||
            ny >= letterCanvas.height
          ) continue

          const neighborIndex =
            (ny * letterCanvas.width + nx) * 4

          if (originalPixels[neighborIndex + 3] > 0) {
            pixels[index] = originalPixels[neighborIndex]
            pixels[index + 1] = originalPixels[neighborIndex + 1]
            pixels[index + 2] = originalPixels[neighborIndex + 2]
            pixels[index + 3] = originalPixels[neighborIndex + 3]
            break
          }
        }

        if (pixels[index + 3] > 0) break
      }
    }
  }

  letterContext.putImageData(imageData, 0, 0)

  context.drawImage(
    letterCanvas,
    x,
    y + verticalOffset,
    drawWidth,
    drawHeight * heightVariation
  )

  return drawWidth + spacing
}
const getEstimatedCharacterWidth = (character) => {
  const sample = handwritingImages[character]

  if (sample) {
    return maxLetterWidth + spacing
  }

  exportContext.save()

  exportContext.font =
    '24px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

  const width =
    Math.max(exportContext.measureText(character).width, maxLetterWidth) +
    spacing

  exportContext.restore()

  return width
}

const wrapTextIntoLines = (text) => {
  const characters = getCharacters(text)
  const lines = []

  let currentLine = ''
  let x = leftMargin

  for (let index = 0; index < characters.length; index++) {
    const character = characters[index]

    if (character === '\n') {
      lines.push(currentLine)
      currentLine = ''
      x = leftMargin
      continue
    }

    if (character === ' ') {
      currentLine += ' '
      x += spaceWidth
      continue
    }

    // Check the complete word before drawing it.
    if (
      index === 0 ||
      characters[index - 1] === ' ' ||
      characters[index - 1] === '\n'
    ) {
      let wordLength = 0

      while (
        index + wordLength < characters.length &&
        characters[index + wordLength] !== ' ' &&
        characters[index + wordLength] !== '\n'
      ) {
        wordLength++
      }

      let estimatedWordWidth = 0

      for (let wordIndex = 0; wordIndex < wordLength; wordIndex++) {
        estimatedWordWidth += getEstimatedCharacterWidth(
          characters[index + wordIndex]
        )
      }

      estimatedWordWidth -= spacing

      if (x + estimatedWordWidth > canvasWidth - rightMargin) {
        lines.push(currentLine)
        currentLine = ''
        x = leftMargin
      }
    }

    currentLine += character
    x += getEstimatedCharacterWidth(character)
  }

  lines.push(currentLine)

  return lines
}

const drawHandwrittenText = (context, lines) => {
  let y = topMargin + 35

  for (const line of lines) {
    let x = leftMargin

    for (const character of getCharacters(line)) {
      if (character === ' ') {
        x += spaceWidth
        continue
      }

      x += drawHandwrittenCharacter(
        context,
        character,
        x,
        y,
        line.length
      )
    }

    y += lineHeight
  }

  return y
}
const renderHandwritingPage = (pageText) => {
  exportCanvas.width = canvasWidth
  exportCanvas.height = canvasPageHeight

  exportContext.clearRect(0, 0, canvasWidth, canvasPageHeight)
  drawRuledLines(exportContext, canvasPageHeight)

  drawHandwrittenText(exportContext, pageText)

  return exportCanvas.toDataURL('image/png')
}
const splitTextIntoPages = (text) => {
  const lines = wrapTextIntoLines(text)

  const firstLineY = topMargin + 35
  const maxCharacterHeight = letterHeight * 1.03 + 2

  const linesPerPage = Math.floor(
    (
      canvasPageHeight -
      bottomMargin -
      firstLineY -
      maxCharacterHeight
    ) / lineHeight
  ) + 1

  const pages = []

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage))
  }

  return pages
}

const handwritingPages = splitTextIntoPages(selectedEntry.content || '')

handwritingPages.forEach((pageText, index) => {
  if (index > 0) {
    pdf.addPage()
  }
  

  const imageData = renderHandwritingPage(pageText)

  pdf.addImage(
    imageData,
    'PNG',
    marginLeft,
    marginTop + 20,
    contentWidth,
    contentHeight - 20
  )
})
const photosResponse = await fetch(
  `${API_BASE_URL}/api/diary/${selectedEntry.id}/photos`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
)

if (!photosResponse.ok) {
  throw new Error('Unable to load diary photos')
}

const photosData = await photosResponse.json()
const entryPhotos = photosData.photos || []
const photoDataUrls = []

for (const photo of entryPhotos) {
  const imageResponse = await fetch(
    `${API_BASE_URL}/api/diary/photos/${photo.id}/image`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!imageResponse.ok) {
    console.warn(`Could not load diary photo: ${photo.id}`)
    continue
  }

  const imageBlob = await imageResponse.blob()

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(
      new Error('Unable to read diary photo')
    )

    reader.readAsDataURL(imageBlob)
  })

  photoDataUrls.push(dataUrl)
}
if (photoDataUrls.length > 0) {
  pdf.addPage()

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('Attached Memories', marginLeft, marginTop + 5)

  let photoY = marginTop + 18

const photoGap = 8
const photoRowGap = 10
const photoBoxWidth = (contentWidth - photoGap) / 2
const photoBoxHeight = 65

let photoColumn = 0
let photoRowHeight = 0

 for (const photoDataUrl of photoDataUrls) {
  const image = await loadHandwritingImage(photoDataUrl)

  const aspectRatio = image.width / image.height

  let imageWidth = photoBoxWidth
  let imageHeight = imageWidth / aspectRatio

  if (imageHeight > photoBoxHeight) {
    imageHeight = photoBoxHeight
    imageWidth = imageHeight * aspectRatio
  }

  if (photoColumn === 0) {
    if (photoY + photoBoxHeight > pageHeight - marginBottom) {
      pdf.addPage()

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Attached Memories', marginLeft, marginTop + 5)

      photoY = marginTop + 18
    }

    photoRowHeight = 0
  }

  const boxX =
    marginLeft + photoColumn * (photoBoxWidth + photoGap)

  const imageX = boxX + (photoBoxWidth - imageWidth) / 2
  const imageY = photoY + (photoBoxHeight - imageHeight) / 2

  pdf.addImage(
    photoDataUrl,
    photoDataUrl.startsWith('data:image/png') ? 'PNG' :
      photoDataUrl.startsWith('data:image/webp') ? 'WEBP' : 'JPEG',
    imageX,
    imageY,
    imageWidth,
    imageHeight
  )

  photoRowHeight = Math.max(photoRowHeight, photoBoxHeight)

  if (photoColumn === 0) {
    photoColumn = 1
  } else {
    photoColumn = 0
    photoY += photoRowHeight + photoRowGap
  }
}
}
const safeTitle = (selectedEntry.title || 'diary-entry')
  .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
  .trim()

pdf.save(`${safeTitle || 'diary-entry'}.pdf`)

  } catch (error) {
    console.error('PDF export error:', error)
    setError('Unable to export diary entry as PDF.')
  } finally {
    setExportingPDF(false)
  }
}

const deleteDiaryPhoto = async (photoId) => {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_BASE_URL}/api/diary/photos/${photoId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Unable to delete photo')
  }

  return data
}

async function uploadDiaryPhoto(diaryEntryId, photo, token) {
  const formData = new FormData()
  formData.append('photo', photo)

  const response = await fetch(
    `${API_BASE_URL}/api/diary/${diaryEntryId}/photos`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `Unable to upload ${photo.name}`)
  }

  return data
}


  async function createDiaryEntry(event) {
  event.preventDefault()

  const token = localStorage.getItem('token')

  if (!token) {
    setError('Please login first.')
    return
  }

  if (!title.trim() || !content.trim()) {
    setError('Title and content are required.')
    return
  }

  setSaving(true)
  setError('')

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      }
    )

    const data = await response.json()

     if (response.ok) {
  const newEntry = data.diaryEntry
  setMessage('Diary entry created successfully.')

  setDiaryEntries((currentEntries) => [
    newEntry,
    ...currentEntries,
  ])

  for (const photo of selectedPhotos) {
    await uploadDiaryPhoto(newEntry.id, photo, token)
  }

  setSelectedPhotos([])
  setTitle('')
  setContent('')
  setShowCreateForm(false)
  setTimeout(() => {
          setMessage('')
        }, 2500)
}else {
      setError(data.message)
    }
  } catch (error) {
    console.error('Create diary entry error:', error)
    setError(error.message ||'Unable to create diary entry.')
  } finally {
    setSaving(false)
  }
}

async function updateDiaryEntry(event) {
  event.preventDefault()

  const token = localStorage.getItem('token')

  if (!token || !editingEntry) {
    return
  }

  if (!title.trim() || !content.trim()) {
    setError('Title and content are required.')
    return
  }

  setSaving(true)
  setError('')

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/${editingEntry.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      }
    )

    const data = await response.json()

   
if (response.ok) {
  for (const photo of selectedPhotos) {
    await uploadDiaryPhoto(editingEntry.id, photo, token)
  }

  setDiaryEntries((currentEntries) =>
    currentEntries.map((entry) =>
      entry.id === editingEntry.id
        ? data.diaryEntry
        : entry
    )
  )

  await getDiaryPhotos(editingEntry.id)

  setEditingEntry(null)
  setSelectedEntry(null)
  setTitle('')
  setContent('')
  setSelectedPhotos([])
  setShowCreateForm(false)
} else {
  setError(data.message || 'Unable to update diary entry.')
} 
  } catch (error) {
    console.error('Update diary entry error:', error)
    setError('Unable to update diary entry.')
  } finally {
    setSaving(false)
  }
}

async function deleteDiaryEntry(entryId) {
  const token = localStorage.getItem('token')

  if (!token) {
    return
  }

  const confirmed = window.confirm(
    'Are you sure you want to delete this diary entry?'
  )

  if (!confirmed) {
    return
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/${entryId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (response.ok) {
      setDiaryEntries((currentEntries) =>
        currentEntries.filter(
          (entry) => entry.id !== entryId
        )
      )

      setSelectedEntry(null)
      
      setError('')
    } else {
      setError(data.message)
    }
  } catch (error) {
    console.error('Delete diary entry error:', error)
    setError('Unable to delete diary entry.')
  }
}
async function unlockDiary(event) {
  event.preventDefault()

  const token = localStorage.getItem('token')

  if (!token) {
    setPinError('Please login first.')
    return
  }

  if (!enteredPin.trim()) {
    setPinError('Please enter your Diary PIN.')
    return
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/unlock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pin: enteredPin,
        }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      setIsDiaryUnlocked(true)
      setEnteredPin('')
      setPinError('')
    } else {
      setPinError(data.message)
    }
  } catch (error) {
    console.error('Unlock diary error:', error)
    setPinError('Unable to unlock diary.')
  }
}

async function checkDiaryPinStatus() {
  const token = localStorage.getItem('token')

  if (!token) {
    setError('Please login first.')
    return
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/pin-status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (response.ok) {
      setHasDiaryPin(data.hasPin)
    } else {
      setError(data.message)
    }
  } catch (error) {
    console.error('Check diary PIN status error:', error)
    setError('Unable to check Diary PIN status.')
  }
}

async function createDiaryPin(event) {
  event.preventDefault()

  const token = localStorage.getItem('token')

  if (!token) {
    setPinError('Please login first.')
    return
  }

  if (!/^\d{4}$/.test(newPin)) {
    setPinError('PIN must be exactly 4 digits.')
    return
  }

  if (newPin !== confirmPin) {
    setPinError('PINs do not match.')
    return
  }

  setPinSaving(true)
  setPinError('')

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/pin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pin: newPin,
        }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      setHasDiaryPin(true)
      setIsDiaryUnlocked(true)
      setNewPin('')
      setConfirmPin('')
      setPinError('')
    } else {
      setPinError(data.message)
    }
  } catch (error) {
    console.error('Create diary PIN error:', error)
    setPinError('Unable to create Diary PIN.')
  } finally {
    setPinSaving(false)
  }
}

useEffect(() => {
  checkDiaryPinStatus()
  getDiaryEntries()
  getHandwritingSamples()
}, [])

if (hasDiaryPin === false) {
  return (
    <div className="diary-lock-screen">
      <div className="diary-lock-card">
        <h1>🔐 Create Diary PIN</h1>

        <p>
          Create a 4-digit PIN to protect your private diary.
        </p>

        <form onSubmit={createDiaryPin}>
          <input
            type="password"
            inputMode="numeric"
            maxLength="4"
            placeholder="Create PIN"
            value={newPin}
            onChange={(event) => setNewPin(event.target.value)}
          />

          <input
            type="password"
            inputMode="numeric"
            maxLength="4"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value)}
          />

          <button type="submit" disabled={pinSaving}>
            {pinSaving ? 'Creating...' : 'Create PIN'}
          </button>
        </form>

        {pinError && <p>{pinError}</p>}
      </div>
    </div>
  )
}

if (!isDiaryUnlocked) {
  return (
    <div className="diary-lock-screen">
      <div className="diary-lock-card">
        <h1>🔐 Diary Locked</h1>

        <p>Enter your Diary PIN to continue.</p>

        <form onSubmit={unlockDiary}>
          <input
            type="password"
            inputMode="numeric"
            maxLength="4"
            placeholder="Enter PIN"
            value={enteredPin}
            onChange={(event) => setEnteredPin(event.target.value)}
          />

          <button type="submit">
            Unlock Diary
          </button>
        </form>

        {pinError && <p>{pinError}</p>}
      </div>
    </div>
  )
}

return (
    <div className="diary-page">
      <div className="diary-header">
        <h1>My Diary</h1>
        <p>Your private space for your thoughts and memories.</p>
      


<button
  type="button"
  onClick={() => {
    setEditingEntry(null)
    setTitle('')
    setContent('')
    setError('')
    setSelectedPhotos([])
    setShowCreateForm(true)
  }}
>
  + New Entry
</button>


        </div> 

        {(showCreateForm || editingEntry) && (
  <div className="diary-form-overlay">
    <div className="diary-form-modal">
   
  <form
    className="diary-form"
    onSubmit={editingEntry ? updateDiaryEntry : createDiaryEntry}
  >
    <input
      type="text"
      placeholder="Entry title"
      value={title}
      onChange={(event) => setTitle(event.target.value)}
    />

    <textarea
      placeholder="Write your thoughts..."
      value={content}
      onChange={(event) => setContent(event.target.value)}
      rows="8"
    />
    <div className="diary-photo-upload">
  <label htmlFor="diary-photos">
    Add photos to your memory
  </label>

  <input
    id="diary-photos"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    onChange={(event) => {
  const newPhotos = Array.from(event.target.files)

  setSelectedPhotos((previousPhotos) => [
    ...previousPhotos,
    ...newPhotos,
  ])

  event.target.value = ''
}}
    
  
  />
</div>


{editingEntry && editingPhotos.length > 0 && (
  <div className="selected-photo-list">
    <p>Existing photos: {editingPhotos.length}</p>
    <ul>
      {editingPhotos.map((photo, index) => (
        <li key={photo.id}>
          <span>Memory photo {index + 1}</span>
          <button
  type="button"
  onClick={async () => {
    try {
      await deleteDiaryPhoto(photo.id)

      setEditingPhotos((previousPhotos) =>
        previousPhotos.filter((item) => item.id !== photo.id)
      )

      setDiaryPhotos((previousPhotos) =>
        previousPhotos.filter((item) => item.id !== photo.id)
      )
    } catch (error) {
      console.error('Delete diary photo error:', error)
      setError(error.message || 'Unable to delete photo')
    }
  }}
>
  Remove
</button>
        </li>
      ))}
    </ul>
  </div>
)}

{selectedPhotos.length > 0 && (
  <div className="selected-photo-list">
    <p>Selected photos: {selectedPhotos.length}</p>

    <ul>
      
{selectedPhotos.map((photo, index) => (
  <li key={`${photo.name}-${photo.lastModified}-${index}`}>
    <span>{photo.name}</span>

    <button
      type="button"
      onClick={() => {
        setSelectedPhotos((previousPhotos) =>
          previousPhotos.filter((_, photoIndex) => photoIndex !== index)
        )
      }}
    >
      Remove
    </button>
  </li>
))}

    </ul>
  </div>
)}

    <div>
      <button
        type="submit"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Entry'}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowCreateForm(false)
          setTitle('')
          setContent('')
          setError('')
          setSelectedPhotos([])
          setEditingEntry(null)
        }}
      >
        Cancel
      </button>
    </div>
  </form>
  </div>
  </div>
)}

{Message && (
        <div className="toast-message">

          <div className="toast-icon">
            ✓
          </div>

          <div>
            <strong>{Message}</strong>
            <span>Your diary entry has been saved.</span>
          </div>

          <button
            onClick={() => setMessage('')}
          >
            ×
          </button>

        </div>
      )}

{error && (
        <div className="toast-message error-toast">

          <div className="toast-icon">
            !
          </div>

          <div>
            <strong>{error}</strong>
          </div>

          <button
            onClick={() => setError('')}
          >
            ×
          </button>

        </div>
      )}

      {loading && (
        <p>Loading diary entries...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {(selectedDate || searchQuery )&& (
  <button
    type="button"
    className="diary-calendar-reset"
    onClick={() => setSelectedDate(null)}
  >
    ← Show all entries
  </button>
)}

{!loading && !error && diaryEntries.length > 0 && (
  <div className="diary-search-wrapper">
    <span className="diary-search-icon" aria-hidden="true">⌕</span>

    <input
      type="search"
      className="diary-search-input"
      placeholder="Search diary by title or content..."
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      aria-label="Search diary entries by title or content"
    />

    
  </div>
)}

     {!loading && !error && filteredDiaryEntries.length === 0 && (
  <p className="diary-empty-message">
    {searchQuery.trim()
      ? 'No diary entries match your search.'
      : selectedDate
        ? 'No diary entries for this date.'
        : 'No diary entries yet.'}
  </p>
)}



      {!loading && !error && filteredDiaryEntries.length > 0 && (
   <>
    {selectedDate && (
      <h3 className="selected-diary-heading">
        Diary entries for{' '}
        {selectedDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h3>
    )}

    <div className="diary-list">
          {filteredDiaryEntries.map((entry) => (
            <div
              className="diary-card"
              key={entry.id}
              onClick={() => {
                  setSelectedEntry(entry)
                  getDiaryPhotos(entry.id)
                  }}
            >
              <h2>{entry.title}</h2>

              <p>
                {entry.content}
              </p>

              <small className="diary-card-date">
  {new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}
</small>
            </div>
          ))}
        </div>
        </>
      )}
      {selectedEntry && (
  <div className="modal-overlay">
    <div className="read-modal">
      <div className="read-header">
        <button
          type="button"
          onClick={() => setSelectedEntry(null)}
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => setSelectedEntry(null)}
        >
          ×
        </button>
      </div>

      <h2>{selectedEntry.title}</h2>

      <div className="read-meta">
        Created on{' '}
        {new Date(
          selectedEntry.createdAt
        ).toLocaleDateString()}
      </div>
      <p className="handwriting-test-note">Note: letters missing from your handwriting samples will appear as Normal Letters.</p>

<div className="read-content">
  <HandwritingRenderer
    text={selectedEntry.content}
    handwritingSamples={handwritingSamples}
  />
</div>



{diaryPhotos.length > 0 && (
   <section className="diary-photos-section">
    <h3>Memories</h3>
  <div className="diary-photo-gallery">
    {diaryPhotos.map((photo,index) => (
      photoImages[photo.id] && (
        <img
          key={photo.id}
          src={photoImages[photo.id]}
          alt="Diary memory"
          className="diary-photo"
          onClick={() => setActivePhotoIndex(index)}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      )
    ))}
  </div>
  </section>
)}


      <div className="read-footer">
<div className="read-footer1">
      <button
      type="button"
  onClick={exportDiaryEntryPDF}
  disabled={exportingPDF}
>
  {exportingPDF ? 'downloading...' : 'download as PDF'}
</button>
        
<button
  type="button"
 
onClick={async () => {
  const entryPhotos = await getDiaryPhotos(selectedEntry.id)

  setEditingPhotos(entryPhotos)
  setEditingEntry(selectedEntry)
  setTitle(selectedEntry.title)
  setContent(selectedEntry.content)
  setSelectedPhotos([])
  setSelectedEntry(null)
  setShowCreateForm(true)
}}
>
  Edit
</button>

</div>
<div className="read-footer2">
  <button
    type="button"
    onClick={() => deleteDiaryEntry(selectedEntry.id)}
  >
     Delete
  </button>
        <button
          type="button"
          onClick={() => setSelectedEntry(null)}
        >
          Close
        </button>
        </div>
      </div>
    </div>
  </div>
)}

{activePhotoIndex !== null &&
  diaryPhotos[activePhotoIndex] &&
  photoImages[diaryPhotos[activePhotoIndex].id] && (
    <div className="photo-viewer-overlay" 
    onTouchStart={(event) =>
  setTouchStartX(event.touches[0].clientX)
}
onTouchEnd={(event) => {
  if (touchStartX === null) return

  const touchEndX = event.changedTouches[0].clientX
  const swipeDistance = touchEndX - touchStartX
  const minimumSwipeDistance = 50

  if (Math.abs(swipeDistance) >= minimumSwipeDistance) {
    if (swipeDistance < 0) {
      setActivePhotoIndex((current) =>
        current < diaryPhotos.length - 1
          ? current + 1
          : current
      )
    } else {
      setActivePhotoIndex((current) =>
        current > 0 ? current - 1 : current
      )
    }
  }

  setTouchStartX(null)
}}>
      <button
        type="button"
        className="photo-viewer-close"
        onClick={() => setActivePhotoIndex(null)}
        aria-label="Close photo viewer"
      >
        ×
      </button>

      <button
  type="button"
  className="photo-viewer-arrow photo-viewer-prev"
  onClick={() =>
    setActivePhotoIndex((current) => current - 1)
  }
  disabled={activePhotoIndex === 0}
  aria-label="Previous photo"
>
  ‹
</button>

<button
  type="button"
  className="photo-viewer-arrow photo-viewer-next"
  onClick={() =>
    setActivePhotoIndex((current) => current + 1)
  }
  disabled={activePhotoIndex === diaryPhotos.length - 1}
  aria-label="Next photo"
>
  ›
</button>

      <img
        src={photoImages[diaryPhotos[activePhotoIndex].id]}
        alt="Diary memory enlarged"
        className="photo-viewer-image"
      />
    </div>
)}



{showCalendar && (
  <div className="diary-calendar-popup">
    
    <div className="diary-calendar-header">
      <button
        type="button"
        onClick={() =>
          setCalendarMonth(
            new Date(calendarYear, calendarMonthIndex - 1, 1)
          )
        }
        aria-label="Previous month"
      >
        ‹
      </button>

      <strong>
        {calendarMonth.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })}
      </strong>

      <button
        type="button"
        onClick={() =>
          setCalendarMonth(
            new Date(calendarYear, calendarMonthIndex + 1, 1)
          )
        }
        aria-label="Next month"
      >
        ›
      </button>
    </div>

    <div className="diary-calendar-weekdays">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
        (day) => (
          <span key={day}>{day}</span>
        )
      )}
    </div>

    <div className="diary-calendar-grid">
      {Array.from({ length: firstDayOfMonth }, (_, index) => (
        <span key={`empty-${index}`} />
      ))}

      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1
        const date = new Date(calendarYear, calendarMonthIndex, day)

const hasEntry = diaryEntries.some((entry) => {
  const entryDate = new Date(entry.createdAt)

  return (
    entryDate.getFullYear() === calendarYear &&
    entryDate.getMonth() === calendarMonthIndex &&
    entryDate.getDate() === day
  )
})

const isSelected =
  selectedDate &&
  selectedDate.getFullYear() === calendarYear &&
  selectedDate.getMonth() === calendarMonthIndex &&
  selectedDate.getDate() === day

        return (
         <button
  key={day}
  type="button"
  className={[
    hasEntry ? 'has-diary-entry' : '',
    isSelected ? 'selected-diary-date' : '',
  ].filter(Boolean).join(' ')}
  onClick={() => {
    setSelectedDate(date)
    setShowCalendar(false)
  }}
>
  {day}
  {hasEntry && <span className="diary-date-dot" />}
</button>
        )
      })}
    </div>
  </div>
)}

<button
  type="button"
  className="floating-calendar-button"
  onClick={() => setShowCalendar((current) => !current)}
  aria-label="Open diary calendar"
  title="Diary calendar"
>
  📅
</button>
    </div>
  )
}


export default DiaryPage