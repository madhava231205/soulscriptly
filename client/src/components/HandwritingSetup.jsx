import { useState } from 'react'
import HandwritingCanvas from './HandwritingCanvas'

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function HandwritingSetup() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [handwritingSamples, setHandwritingSamples] = useState({})

  const currentCharacter = characters[currentIndex]

  function handleSaveSample(sample) {
    setHandwritingSamples((currentSamples) => ({
      ...currentSamples,
      [sample.character]: sample.imageData,
    }))
    console.log('Saved handwriting sample:', sample)
  }

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
    <div>
      <h1>Create Your Handwriting</h1>

      <h2>Draw the character: {currentCharacter}</h2>

      <p>
        Character {currentIndex + 1} of {characters.length}
      </p>

      <HandwritingCanvas
  key={currentCharacter}
  character={currentCharacter}
  onSave={handleSaveSample}
  savedImage={handwritingSamples[currentCharacter]}
/>

      <div>
        <button
          type="button"
          onClick={goToPreviousCharacter}
          disabled={currentIndex === 0}
        >
          Previous
        </button>

        <button
          type="button"
          onClick={goToNextCharacter}
          disabled={currentIndex === characters.length - 1}
        >
          Next
        </button>
      </div>

      <p>
        Samples saved: {Object.keys(handwritingSamples).length} of{' '}
        {characters.length}
      </p>
    </div>
  )
}

export default HandwritingSetup