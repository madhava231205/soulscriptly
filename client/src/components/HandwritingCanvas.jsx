import { useEffect, useRef, useState } from 'react'

function HandwritingCanvas({ character, onSave, savedImage }) {
  const canvasRef = useRef(null)

  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    context.lineWidth = 4
    context.lineCap = 'round'
    context.lineJoin = 'round'
  }, [])

  function startDrawing(event) {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()

    context.beginPath()
    context.moveTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    )

    setIsDrawing(true)
  }

  function draw(event) {
    if (!isDrawing) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()

    context.lineTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    )

    context.stroke()
  }

  function stopDrawing() {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    context.closePath()
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    )
  }
  function saveSample() {
  const canvas = canvasRef.current
  const imageData = canvas.toDataURL('image/png')

  onSave({
    character,
    imageData,
  })
}

  return (
    <div>
      <h2>Draw the character: {character}</h2>
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          background: '#fff',
          cursor: 'crosshair',
        }}
      />

      <div>
        <button
          type="button"
          onClick={clearCanvas}
        >
          Clear
        </button>
        <button type="button" onClick={saveSample}>
  Save Sample
</button>

{savedImage && (
  <div>
    <h3>Saved sample for {character}</h3>

    <img
      src={savedImage}
      alt={`Saved handwriting for ${character}`}
      width="200"
    />
  </div>
)}
      </div>
    </div>
  )
}

export default HandwritingCanvas