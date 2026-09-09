import { useState } from 'react'
import './App.css'

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
      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon">✦</div>

          <div>
            <h1>SoulScriptly</h1>
            <p>Your thoughts. Your story.</p>
          </div>
        </div>

        <nav className="sidebar-nav">

          <button
            className={
              activePage === 'notes'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('notes')}
          >
            <span>▣</span>
            <span>Notes</span>
          </button>

          <button
            className={
              activePage === 'diary'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('diary')}
          >
            <span>▤</span>
            <span>Diary</span>
          </button>

          <button
            className={
              activePage === 'favourites'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() =>
              setActivePage('favourites')
            }
          >
            <span>★</span>
            <span>Favourites</span>
          </button>

          <button
            className={
              activePage === 'settings'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() =>
              setActivePage('settings')
            }
          >
            <span>⚙</span>
            <span>Settings</span>
          </button>

          <button
            className={
              activePage === 'profile'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() =>
              setActivePage('profile')
            }
          >
            <span>●</span>
            <span>Profile</span>
          </button>

        </nav>

        <div className="sidebar-bottom">
          <p>Small notes.</p>
          <p>Big dreams. ♥</p>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">

        {activePage === 'notes' && (
          <>
            {/* Top bar */}
            <div className="top-bar">

              <div className="search-box">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search your notes..."
                />
              </div>

              <div className="top-right">

                <div className="sort-wrapper">
                  <label>Sort by</label>

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value)
                    }
                  >
                    <option value="newest">
                      Newest First
                    </option>

                    <option value="oldest">
                      Oldest First
                    </option>

                    <option value="az">
                      A - Z
                    </option>

                    <option value="za">
                      Z - A
                    </option>
                  </select>
                </div>

                <div className="profile-circle">
                  M
                </div>

              </div>
            </div>

            {/* Notes heading */}
            <section className="notes-header">

              <div>
                <h2>Notes</h2>

                <p>
                  Capture your thoughts, ideas and
                  everything in between.
                </p>
              </div>

            </section>

            {/* Messages */}
            {message && (
              <div className="toast-message">
                <div className="toast-icon">✓</div>

                <div>
                  <strong>{message}</strong>
                  <span>Your note has been saved.</span>
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
                <div className="toast-icon">!</div>

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

            {/* Notes */}
            {sortedNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✎</div>

                <h3>No notes yet</h3>

                <p>
                  Start writing your first thought.
                </p>

                <button
                  className="primary-button"
                  onClick={handleOpenCreateModal}
                >
                  Create Your First Note
                </button>
              </div>
            ) : (
              <section className="notes-grid">

                {sortedNotes.map((note) => {

                  const isFavourite =
                    favouriteNotes.includes(note.id)

                  return (
                    <article
                      className="note-card"
                      key={note.id}
                    >

                      <div className="note-card-header">

                        <h3>{note.title}</h3>

                        <button
                          className={
                            isFavourite
                              ? 'favourite-button favourite-active'
                              : 'favourite-button'
                          }
                          onClick={() =>
                            toggleFavourite(note.id)
                          }
                        >
                          {isFavourite ? '★' : '☆'}
                        </button>

                      </div>

                      <p className="note-preview">
                        {note.content}
                      </p>

                      <div className="note-meta">
                        <span>
                          ◷{' '}
                          {new Date(
                            note.createdAt
                          ).toLocaleDateString()}
                        </span>

                        <span>
                          Note
                        </span>
                      </div>

                      <div className="note-actions">

                        <button
                          className="read-button"
                          onClick={() =>
                            handleRead(note)
                          }
                        >
                          ◉ Read
                        </button>

                        <button
                          className="update-button"
                          onClick={() =>
                            handleEdit(note)
                          }
                        >
                          ✎ Update
                        </button>

                      </div>

                    </article>
                  )
                })}

              </section>
            )}

            {/* Floating add button */}
            <button
              className="floating-add-button"
              onClick={handleOpenCreateModal}
              aria-label="Add new note"
            >
              +
            </button>
          </>
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
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeNoteModal()
            }
          }}
        >

          <div className="note-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingNote
                    ? 'Update Note'
                    : 'Add New Note'}
                </h2>

                <p>
                  {editingNote
                    ? 'Make changes to your note.'
                    : 'Write down what is on your mind.'}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeNoteModal}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreateNote}>

              <label>
                Title <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Enter note title..."
                value={noteTitle}
                onChange={(event) =>
                  setNoteTitle(event.target.value)
                }
                required
              />

              <label>
                Content <span>*</span>
              </label>

              <textarea
                placeholder="Write your thoughts..."
                value={noteContent}
                onChange={(event) =>
                  setNoteContent(event.target.value)
                }
                rows="7"
                maxLength="500"
                required
              />

              <div className="character-count">
                {noteContent.length}/500
              </div>

              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeNoteModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingNote
                    ? 'Update Note'
                    : 'Add Note'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* Read note modal */}
      {selectedNote && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNote(null)
            }
          }}
        >

          <div className="read-modal">

            <div className="read-header">

              <button
                className="back-button"
                onClick={() =>
                  setSelectedNote(null)
                }
              >
                ←
              </button>

              <button
                className="favourite-button favourite-active"
                onClick={() =>
                  toggleFavourite(selectedNote.id)
                }
              >
                {favouriteNotes.includes(
                  selectedNote.id
                )
                  ? '★'
                  : '☆'}
              </button>

            </div>

            <h2>{selectedNote.title}</h2>

            <div className="read-meta">
              ◷{' '}
              {new Date(
                selectedNote.createdAt
              ).toLocaleDateString()}
            </div>

            <div className="read-content">
              {selectedNote.content}
            </div>

            <div className="read-footer">

              <button
                className="update-button"
                onClick={() => {
                  setSelectedNote(null)
                  handleEdit(selectedNote)
                }}
              >
                ✎ Update
              </button>

              <button
                className="read-button"
                onClick={() =>
                  setSelectedNote(null)
                }
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

export default App