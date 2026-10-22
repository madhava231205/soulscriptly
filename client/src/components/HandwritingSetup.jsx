import { useEffect, useState } from 'react'
import HandwritingCanvas from './HandwritingCanvas'

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')

function HandwritingSetup() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [handwritingSamples, setHandwritingSamples] = useState({})

  const currentCharacter = characters[currentIndex]

  
async function handleSaveSample(sample) {
  const token = localStorage.getItem('token')

  if (!token) {
    alert('Please log in again.')
    return
  }

  try {
    const response = await fetch(
      'http://localhost:5000/api/diary/handwriting',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          character: sample.character,
          imageData: sample.imageData,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      alert(data.message || 'Unable to save handwriting sample.')
      return
    }

    setHandwritingSamples((currentSamples) => ({
      ...currentSamples,
      [sample.character]: sample.imageData,
    }))

    alert(`Handwriting for ${sample.character} saved successfully!`)
  } catch (error) {
    console.error('Save handwriting sample error:', error)
    alert('Unable to connect to the server.')
  }
}


async function loadHandwritingSamples() {
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

    if (!response.ok) {
      console.error('Load handwriting samples error:', data.message)
      return
    }

    const savedSamples = {}

    data.samples.forEach((sample) => {
      savedSamples[sample.character] = sample.imageData
    })

    setHandwritingSamples(savedSamples)

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')

const firstMissingIndex = characters.findIndex(
  (character) => !savedSamples[character]
)

setCurrentIndex(
  firstMissingIndex === -1 ? 0 : firstMissingIndex
)

  } catch (error) {
    console.error('Load handwriting samples error:', error)
  }
}

useEffect(() => {
  loadHandwritingSamples()
}, [])


  function goToNextCharacter() {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex((index) => index + 1)
    }
  }

  function goToPreviousCharacter() {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1)
    }
  }

  
  return (
    <div className="handwriting-setup-page">
      <div className="handwriting-setup-header">
        <h1>Create Your Handwriting</h1>
        <p>
          Personalize SoulScriptly by teaching it how you write each letter.
        </p>
      </div>

      <div className="handwriting-setup-card">
        <div className="handwriting-character-info">
          

          <p>
            Character {currentIndex + 1} of {characters.length}
          </p>
        </div>

        <div className="handwriting-navigation">
          <button
            className="handwriting-nav-button"
            type="button"
            onClick={goToPreviousCharacter}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          <button
            className="handwriting-nav-button"
            type="button"
            onClick={goToNextCharacter}
            disabled={currentIndex === characters.length - 1}
          >
            Next →
          </button>
        </div>

        <div className="handwriting-canvas-wrapper">
          <HandwritingCanvas
            key={currentCharacter}
            character={currentCharacter}
            onSave={handleSaveSample}
            savedImage={handwritingSamples[currentCharacter]}
          />
        </div>

        

        <div className="handwriting-progress">
          <p>
            Samples saved: {Object.keys(handwritingSamples).length} of{' '}
            {characters.length}
          </p>
          <div className="handwriting-progress-track">
            <div
              className="handwriting-progress-fill"
              style={{
                width: `${(Object.keys(handwritingSamples).length / characters.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

}

export default HandwritingSetup