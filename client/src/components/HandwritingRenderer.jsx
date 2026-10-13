
import { useEffect, useRef } from 'react'


function HandwritingRenderer({ text, handwritingSamples }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    const canvasWidth = 800
    const maxLetterWidth = 18
    const letterHeight = 30
    const spacing = 5
    const spaceWidth = 20
    const lineHeight = 42
    const leftMargin = 10
    const topMargin = 20
    const rightMargin = 10
    const bottomMargin = 20

  const availableWidth = canvasWidth - leftMargin - rightMargin
const charactersPerLine = Math.max(
  1,
  Math.floor((availableWidth + spacing) / (maxLetterWidth + spacing))
)

    const lineCount = Math.max(
      1,
      text.split('\n').reduce((count, line) => {
        return count + Math.max(
          1,
          Math.ceil(line.length / charactersPerLine)
        )
      }, 0)
    )

    const requiredHeight =
      topMargin + lineCount * lineHeight + bottomMargin

    canvas.width = canvasWidth
    canvas.height = Math.max(200, requiredHeight)

    context.clearRect(0, 0, canvas.width, canvas.height)

    let x = leftMargin
    let y = topMargin

    async function drawText() {
      for (const character of text) {
        const charCode = character.charCodeAt(0)
const heightVariation = 0.97 + ((charCode * (text.length + 1)) % 7) / 100
const verticalOffset = ((charCode * 3) % 5) - 2
        if (character === '\n') {
          x = leftMargin
          y += lineHeight
          continue
        }

        if (character === ' ') {
          x += spaceWidth
          continue
        }

        if (x + maxLetterWidth > canvasWidth - rightMargin) {
          x = leftMargin
          y += lineHeight
        }

        const imageData = handwritingSamples[character]

        if (!imageData) {
          x += maxLetterWidth + spacing
          continue
        }

        const image = new Image()

        await new Promise((resolve) => {
          image.onload = resolve
          image.onerror = resolve
          image.src = imageData
        })

        
        // Keep the letter's original proportions.
        const aspectRatio = image.width / image.height
        const drawHeight = letterHeight
        const drawWidth = Math.max(
          1,
          Math.min(maxLetterWidth, drawHeight * aspectRatio)
        )

        const letterCanvas = document.createElement('canvas')
        letterCanvas.width = Math.max(1, Math.round(drawWidth))
        letterCanvas.height = drawHeight

        const letterContext = letterCanvas.getContext('2d')

        if (!letterContext) {
          x += drawWidth + spacing
          continue
        }

        letterContext.drawImage(
          image,
          0,
          0,
          letterCanvas.width,
          letterCanvas.height
        )

        const pixels = letterContext.getImageData(
          0,
          0,
          letterCanvas.width,
          letterCanvas.height
        )

        for (let i = 0; i < pixels.data.length; i += 4) {
          const alpha = pixels.data[i + 3]

          if (alpha > 0) {
            pixels.data[i] = 0
            pixels.data[i + 1] = 0
            pixels.data[i + 2] = 0
            pixels.data[i + 3] = 255
          }
        }

        // Preserve the original strokes before thickening them.
        const sourcePixels = new Uint8ClampedArray(pixels.data)
        const width = letterCanvas.width
        const height = letterCanvas.height

        for (let py = 0; py < height; py++) {
          for (let px = 0; px < width; px++) {
            const index = (py * width + px) * 4

            if (sourcePixels[index + 3] > 0) {
              continue
            }

            let foundStroke = false

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = px + dx
                const ny = py + dy

                if (
                  nx >= 0 &&
                  nx < width &&
                  ny >= 0 &&
                  ny < height
                ) {
                  const neighborIndex = (ny * width + nx) * 4

                  if (sourcePixels[neighborIndex + 3] > 0) {
                    foundStroke = true
                  }
                }
              }
            }

            if (foundStroke) {
              pixels.data[index] = 0
              pixels.data[index + 1] = 0
              pixels.data[index + 2] = 0
              pixels.data[index + 3] = 255
            }
          }
        }

        letterContext.putImageData(pixels, 0, 0)

       const variedHeight = letterCanvas.height * heightVariation
const variedY = y + verticalOffset

context.drawImage(
  letterCanvas,
  x,
  variedY,
  letterCanvas.width,
  variedHeight
)

        x += letterCanvas.width + spacing

      }
    }

    drawText()
  }, [text, handwritingSamples])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      style={{
        maxWidth: '100%',
        height: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: 'transparent',
      }}
    />
  )
}

export default HandwritingRenderer
