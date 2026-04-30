import { useEffect, useRef } from 'react'
import { V, tau, update } from '../models/grayscott'

type FieldProps = {
  width: number
  height: number
  scale?: number
  F: number
  k: number
  stepsPerFrame: number
  running: boolean
  useTau: boolean
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: return [v, t, p]
    case 1: return [q, v, p]
    case 2: return [p, v, t]
    case 3: return [p, q, v]
    case 4: return [t, p, v]
    default: return [v, p, q]
  }
}

export function Field({
  width,
  height,
  scale = 2,
  F,
  k,
  stepsPerFrame,
  running,
  useTau,
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

      if (useTau && tau) {
        for (let y = 0; y < height; y++) {
          const rowV = V[y]
          const rowT = tau[y]
          for (let x = 0; x < width; x++) {
            const brightness = Math.min(1, 0.18 + rowV[x] * 1.6)
            const [r, g, b] = hsvToRgb(rowT[x], 1, brightness)
            const idx = (y * width + x) * 4
            data[idx] = Math.floor(r * 255)
            data[idx + 1] = Math.floor(g * 255)
            data[idx + 2] = Math.floor(b * 255)
            data[idx + 3] = 255
          }
        }
      } else {
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
      }
      ctx!.putImageData(image, 0, 0)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(rafId)
  }, [width, height, F, k, stepsPerFrame, running, useTau])

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
