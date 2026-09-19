import { useEffect, useState } from 'react'

function DiaryPage() {
  const [diaryEntries, setDiaryEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
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
      setDiaryEntries((currentEntries) => [
        data.diaryEntry,
        ...currentEntries,
      ])

      setTitle('')
      setContent('')
      setShowCreateForm(false)
    } else {
      setError(data.message)
    }
  } catch (error) {
    console.error('Create diary entry error:', error)
    setError('Unable to create diary entry.')
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
      setDiaryEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === editingEntry.id
            ? data.diaryEntry
            : entry
        )
      )

      setEditingEntry(null)
      setSelectedEntry(null)
      setTitle('')
      setContent('')
    } else {
      setError(data.message)
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
    onClick={() => setShowCreateForm(true)}
  >
    + New Entry
  </button>

        </div>  

        { (showCreateForm || editingEntry ) && (
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
        }}
      >
        Cancel
      </button>
    </div>
  </form>
)}

      {loading && (
        <p>Loading diary entries...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading && !error && diaryEntries.length === 0 && (
        <p>No diary entries yet.</p>
      )}

      {!loading && !error && diaryEntries.length > 0 && (
        <div className="diary-list">
          {diaryEntries.map((entry) => (
            <div
              className="diary-card"
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
            >
              <h2>{entry.title}</h2>

              <p>
                {entry.content}
              </p>

              <small>
                {new Date(entry.createdAt).toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
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
        {selectedEntry.content}
      </div>

      <div className="read-footer">
        <button
    type="button"
    onClick={() => {
      setEditingEntry(selectedEntry)
      setTitle(selectedEntry.title)
      setContent(selectedEntry.content)
      setSelectedEntry(null)
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
    </div>
  )
}


export default DiaryPage