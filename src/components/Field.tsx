import { useEffect, useRef } from 'react'
import { V, update } from '../models/grayscott'

type FieldProps = {
  width: number
  height: number
  scale?: number
  F: number
  k: number
  stepsPerFrame: number
  running: boolean
}

export function Field({
  width,
  height,
  scale = 2,
  F,
  k,
  stepsPerFrame,
  running,
}: FieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = ctx.createImageData(width, height)
    const data = image.data
    let rafId = 0

    function frame() {
      if (running) {
        for (let s = 0; s < stepsPerFrame; s++) update(F, k)
      }

      for (let y = 0; y < height; y++) {
        const row = V[y]
        for (let x = 0; x < width; x++) {
          const c = Math.max(0, Math.min(255, Math.floor(row[x] * 255 * 2)))
          const idx = (y * width + x) * 4
          data[idx] = c
          data[idx + 1] = c
          data[idx + 2] = c
          data[idx + 3] = 255
        }
      }
      ctx!.putImageData(image, 0, 0)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(rafId)
  }, [width, height, F, k, stepsPerFrame, running])

  return (
    <canvas
      ref={canvasRef}
      className="field"
      width={width}
      height={height}
      style={{ width: width * scale, height: height * scale }}
    />
  )
}
