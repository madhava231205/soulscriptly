function NoteCard({
  note,
  isFavourite,
  onToggleFavourite,
  onRead,
  onEdit,
}) {
  return (
    <article className="note-card">
      <div className="note-card-header">
        <h3>{note.title}</h3>

        <button
          className={
            isFavourite
              ? 'favourite-button favourite-active'
              : 'favourite-button'
          }
          onClick={() => onToggleFavourite(note.id)}
        >
          {isFavourite ? '★' : '☆'}
        </button>
      </div>

      <p className="note-preview">
        {note.content}
      </p>

      <div className="note-meta">
        <span>
          ◷ {new Date(note.createdAt).toLocaleDateString()}
        </span>

        <span>
          Note
        </span>
      </div>

      <div className="note-actions">
        <button
          className="read-button"
          onClick={() => onRead(note)}
        >
          ◉ Read
        </button>

        <button
          className="update-button"
          onClick={() => onEdit(note)}
        >
          ✎ Update
        </button>
      </div>
    </article>
  )
}

export default NoteCard