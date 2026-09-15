
function ReadNoteModal({ note, onClose, onDelete }) {
  if (!note) {
    return null
  }

  function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this note?'
    )

    if (confirmed) {
      onDelete(note.id)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="read-modal">

        <div className="read-header">
          <button
            type="button"
            className="back-button"
            onClick={onClose}
          >
            ←
          </button>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <h2>{note.title}</h2>

        <div className="read-meta">
          Created on{' '}
          {new Date(note.createdAt).toLocaleDateString()}
        </div>

        <div className="read-content">
          {note.content}
        </div>

        <div className="read-footer">
          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
          >
            🗑 Delete
          </button>

          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

export default ReadNoteModal

