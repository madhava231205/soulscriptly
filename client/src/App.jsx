import { useState } from 'react'
import './App.css'

function App() {
  const [started, setStarted] = useState(false)
  const [name, setName] = useState('')

  return (
    <main>
      <h1>SoulScriptly</h1>

      <p>Your thoughts. Your story.</p>

      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      {name && <p>Hello, {name}! ❤️</p>}

      {started && <p>Welcome to SoulScriptly ❤️</p>}

      <button onClick={() => setStarted(true)}>
        Get Started
      </button>
    </main>
  )
}

export default App