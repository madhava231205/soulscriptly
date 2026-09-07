import { useState } from 'react'
import './App.css'

function App() {
  const [started, setStarted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
const [noteContent, setNoteContent] = useState('')

async function handleSubmit(event) {
  event.preventDefault()

  setMessage('')
  setError('')
  setLoading(true)

  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setMessage(data.message)
    } else {
      setError(data.message)
    }
  } catch (error) {
    setError('Unable to connect to server. Please try again.')
  } finally {
    setLoading(false)
  }
}
async function handleLogin(event) {
  event.preventDefault()

  setMessage('')
  setError('')
  setLoading(true)

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem('token', data.token)
      setMessage(data.message)
    } else {
      setError(data.message)
    }
  } catch (error) {
    setError('Unable to connect to server. Please try again.')
  } finally {
    setLoading(false)
  }
}

async function getNotes() {
  const token = localStorage.getItem('token')

  try {
    const response = await fetch('http://localhost:5000/api/notes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log("Get notes success:", data.notes)
      setNotes(data.notes)
      

    } else {
      console.log(data.message)
    }
  } catch (error) {
    console.error('Get notes error:', error)
  }
}

async function handleCreateNote(event) {
  event.preventDefault()
  setMessage('')
  setError('')
  setLoading(true)

  const token = localStorage.getItem('token')

  try {
    const response = await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
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
      setNotes((currentNotes) => [data.note, ...currentNotes])
      setNoteTitle('')
      setNoteContent('')
      setMessage('Note saved successfully!')
    }
  } catch (error) {
    console.error('Create note error:', error)
  }finally {
  setLoading(false)
}
}

  return (
    <main>
      <h1>SoulScriptly</h1>

      <p>Your thoughts. Your story.</p>

      {isLogin ? (
  <div>
    <h2>Login</h2>

    <form  onSubmit = {handleLogin}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(event) => setPassword(event.target.value)} 
      />

      <button type="submit" disabled={loading}> 
        {loading ? 'Logging in...' : 'Login'}
      </button>

    </form>

    <button type="button" onClick={() => setIsLogin(false)}>
  Create a new account
</button>


  </div>

  
) : (
  <div>
    <h2>Create Account</h2>

  <form onSubmit={handleSubmit}>
    <input
      type="text"
      placeholder="Enter your name"
      value={name}
      onChange={(event) => setName(event.target.value)}
    />

    <input
      type="email"
      placeholder="Enter your email"
      value={email}
      onChange={(event) => setEmail(event.target.value)}
    />

    <input
      type="password"
      placeholder="Enter your password"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
    />

    <button type="submit" disabled={loading}>
      {loading ? 'Creating account...' : 'Create Account'}
    </button>
  </form>

    <button type="button" onClick={() => setIsLogin(true)}>
  Already have an account? Login
</button>

  </div>

)}



{message && <p>{message}</p>}
{error && <p>{error}</p>}
<button type="button" onClick={getNotes}>
  Load My Notes
</button>
<h2>Create a Note</h2>

<form onSubmit={handleCreateNote}>
  <input
    type="text"
    placeholder="Note title"
    value={noteTitle}
    onChange={(event) => setNoteTitle(event.target.value)}
  />

  <textarea
    placeholder="Write your note..."
    value={noteContent}
    onChange={(event) => setNoteContent(event.target.value)}
  />

  <button type="submit" disabled={loading}>
  {loading ? 'Saving...' : 'Save Note'}
</button>
</form>
{message && <p>{message}</p>}
{error && <p>{error}</p>}

{ (notes.map((note) => (
  <div key={note.id}>
    <h3>{note.title}</h3>
    <p>{note.content}</p>
  </div>
)))}




    </main>
  )
}

export default App