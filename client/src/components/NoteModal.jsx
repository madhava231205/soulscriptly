function NoteModal({
  noteTitle,
  setNoteTitle,
  noteContent,
  setNoteContent,
  editingNote,
  loading,
  onSubmit,
  onClose,
}) {
  return (
    <div className="modal-overlay">
      <div className="note-modal">

        <div className="modal-header">
          <div>
            <h2>
              {editingNote ? 'Update Note' : 'Add New Note'}
            </h2>

            <p>
              {editingNote
                ? 'Make changes to your note.'
                : 'Write down something worth remembering.'}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>

          <div className="form-group">
            <label>Title</label>

            <input
              type="text"
              placeholder="Enter note title"
              value={noteTitle}
              onChange={(event) =>
                setNoteTitle(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Content</label>

            <textarea
              placeholder="Write your thoughts..."
              value={noteContent}
              onChange={(event) =>
                setNoteContent(event.target.value)
              }
              rows="8"
            />
          </div>

          <div className="modal-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
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
                  : 'Save Note'}
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default NoteModal