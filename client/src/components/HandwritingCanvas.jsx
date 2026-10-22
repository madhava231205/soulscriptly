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

  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  context.beginPath()
  context.moveTo(
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY
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

  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  context.lineTo(
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY
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
  const context = canvas.getContext('2d')

  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  )

  let minX = canvas.width
  let minY = canvas.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = imageData.data[
        (y * canvas.width + x) * 4 + 3
      ]

      if (alpha > 0) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX === -1) {
    alert('Please draw the character before saving.')
    return
  }

  const padding = 8

  const cropX = Math.max(0, minX - padding)
  const cropY = Math.max(0, minY - padding)
  const cropRight = Math.min(
    canvas.width,
    maxX + padding + 1
  )
  const cropBottom = Math.min(
    canvas.height,
    maxY + padding + 1
  )

  const cropWidth = cropRight - cropX
  const cropHeight = cropBottom - cropY

  const croppedCanvas = document.createElement('canvas')
  croppedCanvas.width = cropWidth
  croppedCanvas.height = cropHeight

  const croppedContext = croppedCanvas.getContext('2d')

  croppedContext.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  )

  const croppedImage = croppedCanvas.toDataURL('image/png')

  onSave({
    character,
    imageData: croppedImage,
  })
}



  
  return (
    <div className="handwriting-canvas-component">
      <h2 className="handwriting-canvas-title">
        Draw the character: <span>{character}</span>
      </h2>

      <div className="handwriting-drawing-area">
        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="handwriting-drawing-canvas"
        />
      </div>

      <div className="handwriting-canvas-actions">
        <button
          className="handwriting-clear-button"
          type="button"
          onClick={clearCanvas}
        >
          Clear
        </button>

        <button
          className="handwriting-save-button"
          type="button"
          onClick={saveSample}
        >
          Save Sample
        </button>
      </div>

      {savedImage && (
        <div className="handwriting-saved-sample">
          <h3>Saved sample for {character}</h3>
          <img
            src={savedImage}
            alt={`Saved handwriting for ${character}`}
          />
        </div>
      )}
    </div>
  )

}

export default HandwritingCanvas