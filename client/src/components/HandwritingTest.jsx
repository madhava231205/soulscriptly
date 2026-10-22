
import { useEffect, useState } from 'react'
import HandwritingRenderer from './HandwritingRenderer'

function HandwritingTest() {
  const [text, setText] = useState('Hello')
  const [handwritingSamples, setHandwritingSamples] = useState({})

  useEffect(() => {
    async function loadSamples() {
      const token = localStorage.getItem('token')

      if (!token) {
        return
      }

      try {
        const response = await fetch(
          'http://localhost:5000/api/diary/handwriting',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (response.ok) {
          const samples = {}

          data.samples.forEach((sample) => {
            samples[sample.character] = sample.imageData
          })

          setHandwritingSamples(samples)
        }
      } catch (error) {
        console.error('Failed to load handwriting samples:', error)
      }
    }

    loadSamples()
  }, [])

  
  return (
    <div className="handwriting-test-page">
      <div className="handwriting-test-header">
        <h1>Handwriting Preview</h1>
        <p>
          See how your saved handwriting transforms typed text into something
          personal.
        </p>
      </div>

      <div className="handwriting-test-card">
        <label
          className="handwriting-test-label"
          htmlFor="handwriting-text"
        >
          Enter text to preview
        </label>

        <input
          id="handwriting-text"
          className="handwriting-test-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type something..."
        />

        <p className="handwriting-test-note">
          Note: letters missing from your handwriting samples will appear as
          blank spaces.
        </p>

        <div className="handwriting-test-result">
          <h2>Your preview</h2>
          <HandwritingRenderer
            text={text}
            handwritingSamples={handwritingSamples}
          />
        </div>
      </div>
    </div>
  )

}

export default HandwritingTest
