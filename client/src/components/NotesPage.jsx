import NoteCard from './NoteCard'
function NotesPage({
  sortedNotes,
  sortBy,
  setSortBy,
  favouriteNotes,
  toggleFavourite,
  handleRead,
  handleEdit,
  handleOpenCreateModal,
  message,
  error,
  setMessage,
  setError,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <>
      {/* Top bar */}
      <div className="top-bar">

        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search your notes..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
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

      {/* Success message */}
      {message && (
        <div className="toast-message">

          <div className="toast-icon">
            ✓
          </div>

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

      {/* Error message */}
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

      {/* Notes */}
      {sortedNotes.length === 0 ? (
  <div className="empty-state">
    <div className="empty-icon">✎</div>

    <h3>
      {searchTerm
        ? 'No matching notes'
        : 'No notes yet'}
    </h3>

    <p>
      {searchTerm
        ? 'Try searching with a different word.'
        : 'Start writing your first thought.'}
    </p>

    {!searchTerm && (
      <button
        className="primary-button"
        onClick={handleOpenCreateModal}
      >
        Create Your First Note
      </button>
    )}
  </div>
        ) : (
        <section className="notes-grid">
            {sortedNotes.map((note) => (
              <NoteCard
                  key={note.id}
                  note={note}
                  isFavourite={favouriteNotes.includes(note.id)}
                  onToggleFavourite={toggleFavourite}
                  onRead={handleRead}
                  onEdit={handleEdit}
                />
            ))}
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
  )
}

export default NotesPage