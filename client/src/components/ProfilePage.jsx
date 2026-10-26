
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
        <div className="profile-avatar">
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
</div>

<div className="profile-picture-upload">
  <label htmlFor="profile-picture">Choose a profile picture</label>

  <input
    id="profile-picture"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(event) => {
      setSelectedPicture(event.target.files?.[0] || null)
      setPictureMessage('')
    }}
  />

  <button
    type="button"
    onClick={handlePictureUpload}
    disabled={!selectedPicture || isUploadingPicture}
  >
    {isUploadingPicture ? 'Uploading...' : 'Upload Picture'}
  </button>

  {pictureMessage && <p role="status">{pictureMessage}</p>}
</div>

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
    </div>
  )
}

export default ProfilePage
