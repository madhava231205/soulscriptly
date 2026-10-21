import { useEffect, useState } from 'react'
import HandwritingRenderer from './HandwritingRenderer'

function DiaryPage() {
  const [diaryEntries, setDiaryEntries] = useState([])
  const [handwritingSamples, setHandwritingSamples] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
            `http://localhost:5000/api/diary/photos/${photo.id}/image`,
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
      'http://localhost:5000/api/diary/handwriting',
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
        'http://localhost:5000/api/diary',
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
      `http://localhost:5000/api/diary/${diaryId}/photos`,
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

const deleteDiaryPhoto = async (photoId) => {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `http://localhost:5000/api/diary/photos/${photoId}`,
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
    `http://localhost:5000/api/diary/${diaryEntryId}/photos`,
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
      'http://localhost:5000/api/diary',
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
      `http://localhost:5000/api/diary/${editingEntry.id}`,
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
      `http://localhost:5000/api/diary/${entryId}`,
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
      'http://localhost:5000/api/diary/unlock',
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
      'http://localhost:5000/api/diary/pin-status',
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
      'http://localhost:5000/api/diary/pin',
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

  <button
    type="button"
    onClick={() => deleteDiaryEntry(selectedEntry.id)}
  >
    🗑 Delete
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