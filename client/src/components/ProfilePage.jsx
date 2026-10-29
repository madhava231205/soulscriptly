
import { useEffect, useState } from 'react'

function ProfilePage({ currentUser, setCurrentUser }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(currentUser?.name || '')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedPicture, setSelectedPicture] = useState(null)
const [isUploadingPicture, setIsUploadingPicture] = useState(false)
const [pictureMessage, setPictureMessage] = useState('')
const [profilePictureUrl, setProfilePictureUrl] = useState('')
const [showPicturePopup, setShowPicturePopup] = useState(false)
const [showPicturePreview, setShowPicturePreview] = useState(false)
const [stats, setStats] = useState({
  notes: 0,
  diaryEntries: 0,
  memories: 0,
})

const [isLoadingStats, setIsLoadingStats] = useState(true)
const [statsError, setStatsError] = useState('')


useEffect(() => {
  const loadStats = async () => {
    try {
      setIsLoadingStats(true)
      setStatsError('')

      const token = localStorage.getItem('token')

      if (!token) {
        setStatsError('Please sign in to view your statistics.')
        return
      }

      const response = await fetch(
        'http://localhost:5000/api/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not load writing statistics.'
        )
      }

      setStats(data.stats)
    } catch (error) {
      setStatsError(
        error.message || 'Could not load writing statistics.'
      )
    } finally {
      setIsLoadingStats(false)
    }
  }

  loadStats()
}, [])



useEffect(() => {
  let imageUrl

  const loadProfilePicture = async () => {
    const token = localStorage.getItem('token')

    if (!token || !currentUser?.profilePicture) {
      setProfilePictureUrl('')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/profile/picture/image',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        setProfilePictureUrl('')
        return
      }

      const imageBlob = await response.blob()
      imageUrl = URL.createObjectURL(imageBlob)
      setProfilePictureUrl(imageUrl)
    } catch {
      setProfilePictureUrl('')
    }
  }

  loadProfilePicture()

  return () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
  }
}, [currentUser?.profilePicture])


  const handleSave = async () => {
    
    const trimmedName = name.trim()

    if (!trimmedName) {
      setMessage('Name cannot be empty.')
      return
    }

    try {
      setIsSaving(true)
      setMessage('')

      const token = localStorage.getItem('token')

      

      const response = await fetch(
        'http://localhost:5000/api/auth/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmedName }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Could not update your name.')
        return
      }

      setCurrentUser(data.user)
      setName(data.user.name)
      setIsEditing(false)
      setMessage('Name updated successfully!')
      setTimeout(() => {
          setMessage('')
        }, 2500)
    } catch (error) {
      
      setMessage('Could not connect to the server.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePictureUpload = async () => {
  if (!selectedPicture) {
    setPictureMessage('Please select a picture first.')
    return
  }

  try {
    setIsUploadingPicture(true)
    setPictureMessage('')

    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('profilePicture', selectedPicture)

    const response = await fetch(
      'http://localhost:5000/api/auth/profile/picture',
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setPictureMessage(data.message || 'Could not upload picture.')
      return
    }

    setCurrentUser(data.user)
    setSelectedPicture(null)
    setPictureMessage('Profile picture updated successfully!')
  } catch (error) {
    setPictureMessage('Could not connect to the server.')
  } finally {
    setIsUploadingPicture(false)
  }
}


  const handleCancel = () => {
    setName(currentUser?.name || '')
    setIsEditing(false)
    setMessage('')
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your personal information.</p>
      </div>

      <div className="profile-card">
        
<div className="profile-avatar-wrapper">
  <button
    type="button"
    className="profile-avatar"
    onClick={() => setShowPicturePreview(true)}
    aria-label="View profile picture"
  >
    {profilePictureUrl ? (
      <img
        src={profilePictureUrl}
        alt="Profile"
        className="profile-picture"
      />
    ) : (
      currentUser?.name
        ? currentUser.name.charAt(0).toUpperCase()
        : 'U'
    )}
  </button>

  <button
    type="button"
    className="profile-camera-button"
    onClick={() => setShowPicturePopup(true)}
    aria-label="Change profile picture"
    title="Change profile picture"
  >
    📷
  </button>
</div>

{showPicturePopup && (
  <div
    className="profile-popup-backdrop"
    onClick={() => setShowPicturePopup(false)}
  >
    <div
      className="profile-picture-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picture-popup-title"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="profile-popup-close"
        onClick={() => setShowPicturePopup(false)}
        aria-label="Close"
      >
        ×
      </button>

      <h3 id="picture-popup-title">Change profile picture</h3>
      <p>Choose a new photo for your profile.</p>

      <label htmlFor="profile-picture" className="profile-file-label">
        Choose image
      </label>

      <input
        id="profile-picture"
        className="profile-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          setSelectedPicture(event.target.files?.[0] || null)
          setPictureMessage('')
        }}
      />

      {selectedPicture && (
        <p className="profile-selected-file">
          Selected: {selectedPicture.name}
        </p>
      )}

      {pictureMessage && <p role="status">{pictureMessage}</p>}

      <button
        type="button"
        onClick={async () => {
          await handlePictureUpload()
        }}
        disabled={!selectedPicture || isUploadingPicture}
      >
        {isUploadingPicture ? 'Uploading...' : 'Upload Picture'}
      </button>
    </div>
  </div>
)}

{showPicturePreview && profilePictureUrl && (
  <div
    className="profile-preview-backdrop"
    onClick={() => setShowPicturePreview(false)}
  >
    <div
      className="profile-picture-preview"
      role="dialog"
      aria-modal="true"
      aria-label="Profile picture preview"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="profile-preview-close"
        onClick={() => setShowPicturePreview(false)}
        aria-label="Close picture preview"
      >
        ×
      </button>

      <img src={profilePictureUrl} alt="Full-size profile" />
    </div>
  </div>
)}


        <h3>{currentUser?.name || 'Your Name'}</h3>
        <p>{currentUser?.email || 'Your Email'}</p>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setName(currentUser?.name || '')
              setMessage('')
              setIsEditing(true)
            }}
          >
            Edit Name
          </button>
        ) : (
          <div className="profile-edit-form">
            <label htmlFor="profile-name">Your name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              maxLength={100}
            />

            <div className="profile-edit-actions">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        
        {message && <p role="status">{message}</p>}
      </div>

      <section className="profile-stats">
        <div className="profile-stats-heading">
          <h3> ✦ My Writing Journey ✦</h3>
          <p>Every little moment you save becomes part of your story.</p>
        </div>

        {statsError && <p role="alert">{statsError}</p>}

        <div className="profile-stats-grid">
          <div className="profile-stat-card notes-stat">
            <span className="profile-stat-icon">📝</span>
            <h4>{isLoadingStats ? '—' : stats.notes}</h4>
            <p>Notes</p>
          </div>

          <div className="profile-stat-card diary-stat">
            <span className="profile-stat-icon">📖</span>
            <h4>{isLoadingStats ? '—' : stats.diaryEntries}</h4>
            <p>Diary Entries</p>
          </div>

          <div className="profile-stat-card memories-stat">
            <span className="profile-stat-icon">📸</span>
            <h4>{isLoadingStats ? '—' : stats.memories}</h4>
            <p>Memories</p>
          </div>
        </div>
      </section>
    </div>

  )
}

export default ProfilePage
