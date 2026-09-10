import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import NoteModal from './components/NoteModal'
import ReadNoteModal from './components/ReadNoteModal'
import NotesPage from './components/NotesPage'

function App() {
  // -----------------------------
  // Authentication state
  // -----------------------------
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [isLogin, setIsLogin] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('token'))
  )

  // -----------------------------
  // Notes state
  // -----------------------------
  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [editingNote, setEditingNote] = useState(null)

  // -----------------------------
  // UI state
  // -----------------------------
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [activePage, setActivePage] = useState('notes')
  const [favouriteNotes, setFavouriteNotes] = useState([])

  // -----------------------------
  // Register
  // -----------------------------
  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setMessage('Account created successfully! Please login.')
        setName('')
        setPassword('')
        setIsLogin(true)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------
  // Login
  // -----------------------------
  async function handleLogin(event) {
    event.preventDefault()

    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)

        setMessage('')
        setError('')
        setIsAuthenticated(true)

        await getNotes()
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------
  // Get notes
  // -----------------------------
  async function getNotes() {
    const token = localStorage.getItem('token')

    if (!token) {
      return
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/notes',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setNotes(data.notes)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Unable to load your notes.')
    }
  }

  // -----------------------------
  // Open create note modal
  // -----------------------------
  function handleOpenCreateModal() {
    setEditingNote(null)
    setNoteTitle('')
    setNoteContent('')
    setMessage('')
    setError('')
    setShowNoteModal(true)
  }

  // -----------------------------
  // Open update modal
  // -----------------------------
  function handleEdit(note) {
    setEditingNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setMessage('')
    setError('')
    setShowNoteModal(true)
  }

  // -----------------------------
  // Close note modal
  // -----------------------------
  function closeNoteModal() {
    setShowNoteModal(false)
    setEditingNote(null)
    setNoteTitle('')
    setNoteContent('')
    setError('')
  }

  // -----------------------------
  // Create / Update note
  // -----------------------------
  async function handleCreateNote(event) {
    event.preventDefault()

    setMessage('')
    setError('')
    setLoading(true)

    const token = localStorage.getItem('token')

    try {
      const isEditing = editingNote !== null

      const url = isEditing
        ? `http://localhost:5000/api/notes/${editingNote.id}`
        : 'http://localhost:5000/api/notes'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (isEditing) {
          setNotes((currentNotes) =>
            currentNotes.map((note) =>
              note.id === editingNote.id ? data.note : note
            )
          )

          setMessage('Note updated successfully!')
        } else {
          setNotes((currentNotes) => [
            data.note,
            ...currentNotes,
          ])

          setMessage('Note added successfully!')
        }

        closeNoteModal()

        // Show success message after modal closes
        setTimeout(() => {
          setMessage('')
        }, 2500)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------
  // Favourite note
  // -----------------------------
  function toggleFavourite(noteId) {
    setFavouriteNotes((currentFavourites) => {
      if (currentFavourites.includes(noteId)) {
        return currentFavourites.filter(
          (id) => id !== noteId
        )
      }

      return [...currentFavourites, noteId]
    })
  }

  // -----------------------------
  // Read note
  // -----------------------------
  function handleRead(note) {
    setSelectedNote(note)
  }

  // -----------------------------
  // Logout
  // -----------------------------
  function handleLogout() {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setNotes([])
    setFavouriteNotes([])
    setMessage('')
    setError('')
  }

  // -----------------------------
  // Sorting
  // -----------------------------
  const sortedNotes = [...notes].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    }

    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt)
    }

    if (sortBy === 'az') {
      return a.title.localeCompare(b.title)
    }

    if (sortBy === 'za') {
      return b.title.localeCompare(a.title)
    }

    return 0
  })

  // -----------------------------
  // Authentication screen
  // -----------------------------
  if (!isAuthenticated) {
    return (
      <main className="auth-page">
        <div className="auth-card">

          <div className="auth-logo">
            <span className="logo-feather">✦</span>
            <div>
              <h1>SoulScriptly</h1>
              <p>Your thoughts. Your story.</p>
            </div>
          </div>

          <div className="auth-heading">
            <h2>
              {isLogin
                ? 'Welcome back'
                : 'Create your account'}
            </h2>

            <p>
              {isLogin
                ? 'Continue writing your story.'
                : 'Start your personal journey with SoulScriptly.'}
            </p>
          </div>

          {message && (
            <div className="message success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="message error-message">
              {error}
            </div>
          )}

          {isLogin ? (
            <form
              className="auth-form"
              onSubmit={handleLogin}
            >
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />

              <button
                className="primary-button auth-button"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />

              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />

              <button
                className="primary-button auth-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create Account'}
              </button>
            </form>
          )}

          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
              setError('')
            }}
          >
            {isLogin
              ? "Don't have an account? Create one"
              : 'Already have an account? Login'}
          </button>
        </div>
      </main>
    )
  }

  // -----------------------------
  // Main application
  // -----------------------------
  return (
    <div className="app-layout">

      {/* Mobile top bar */}
      <header className="mobile-header">
        <div className="brand">
          <span className="brand-feather">✦</span>
          <span>SoulScriptly</span>
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          onClick={() =>
            document.body.classList.toggle(
              'sidebar-open'
            )
          }
        >
          ☰
        </button>
      </header>

      {/* Sidebar */}
      <Sidebar
  activePage={activePage}
  setActivePage={setActivePage}
  handleLogout={handleLogout}
/>
      {/* Main content */}
      <main className="main-content">

        {activePage === 'notes' && (
                <NotesPage
                sortedNotes={sortedNotes}
                sortBy={sortBy}
                setSortBy={setSortBy}
                favouriteNotes={favouriteNotes}
                toggleFavourite={toggleFavourite}
                handleRead={handleRead}
                handleEdit={handleEdit}
                handleOpenCreateModal={handleOpenCreateModal}
                message={message}
                error={error}
                setMessage={setMessage}
                setError={setError}
              />
            )}

        {activePage !== 'notes' && (
          <div className="coming-soon">
            <div className="coming-soon-icon">
              ✦
            </div>

            <h2>
              {activePage === 'diary' &&
                'Diary is coming next'}

              {activePage === 'favourites' &&
                'Favourites'}

              {activePage === 'settings' &&
                'Settings'}

              {activePage === 'profile' &&
                'Profile'}
            </h2>

            <p>
              We're building this part of
              SoulScriptly next.
            </p>

            <button
              className="primary-button"
              onClick={() => setActivePage('notes')}
            >
              Back to Notes
            </button>
          </div>
        )}

      </main>

      {/* Add / Update modal */}
      {showNoteModal && (
  <NoteModal
    noteTitle={noteTitle}
    setNoteTitle={setNoteTitle}
    noteContent={noteContent}
    setNoteContent={setNoteContent}
    editingNote={editingNote}
    loading={loading}
    onSubmit={handleCreateNote}
    onClose={() => {
      setShowNoteModal(false)
      setEditingNote(null)
      setNoteTitle('')
      setNoteContent('')
    }}
  />
)}

      {/* Read note modal */}
      {selectedNote && (
  <ReadNoteModal
    note={selectedNote}
    onClose={() => setSelectedNote(null)}
  />
)}

    </div>
  )
}

export default App