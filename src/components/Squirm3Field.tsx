import { useEffect, useRef } from 'react'
import { grid, hasBond, step, WIDTH, HEIGHT } from '../models/squirm3'
import type { AtomType } from '../models/squirm3'

const COLORS: Record<AtomType, string> = {
    a: '#ef4444',
    b: '#22c55e',
    c: '#3b82f6',
    d: '#eab308',
    e: '#a855f7',
    f: '#06b6d4',
}

type Props = {
    cellSize?: number
    stepsPerFrame: number
    running: boolean
    showLabels: boolean
}

export function Squirm3Field({ cellSize = 10, stepsPerFrame, running, showLabels }: Props) {
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const W = WIDTH * cellSize
        const H = HEIGHT * cellSize
        let raf = 0

        function frame() {
            if (running) {
                for (let s = 0; s < stepsPerFrame; s++) step()
            }
            ctx!.fillStyle = '#0b0d12'
            ctx!.fillRect(0, 0, W, H)

            // Atoms
            for (let i = 0; i < grid.length; i++) {
                const a = grid[i]
                if (!a) continue
                const x = (i % WIDTH) * cellSize
                const y = Math.floor(i / WIDTH) * cellSize
                ctx!.fillStyle = COLORS[a.type]
                ctx!.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
                if (showLabels && cellSize >= 10) {
                    ctx!.fillStyle = '#000'
                    ctx!.font = `bold ${cellSize - 3}px ui-monospace, monospace`
                    ctx!.textAlign = 'center'
                    ctx!.textBaseline = 'middle'
                    ctx!.fillText(a.type + a.state, x + cellSize / 2, y + cellSize / 2 + 0.5)
                }
            }
            // Bonds (lines between bonded atom centers)
            ctx!.strokeStyle = '#fff'
            ctx!.lineWidth = 1.2
            for (let i = 0; i < grid.length; i++) {
                if (!grid[i]) continue
                const x = i % WIDTH, y = Math.floor(i / WIDTH)
                // Check 4 neighbors (right, down, down-right, down-left) to draw each bond once
                const checks: [number, number][] = [[1, 0], [0, 1], [1, 1], [-1, 1]]
                for (const [dx, dy] of checks) {
                    const nx = (x + dx + WIDTH) % WIDTH
                    const ny = (y + dy + HEIGHT) % HEIGHT
                    const j = ny * WIDTH + nx
                    if (!grid[j]) continue
                    if (!hasBond(i, j)) continue
                    // Skip wrap-around bonds visually (would draw line across whole canvas)
                    if (Math.abs(nx - x) > 1 || Math.abs(ny - y) > 1) continue
                    ctx!.beginPath()
                    ctx!.moveTo(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2)
                    ctx!.lineTo(nx * cellSize + cellSize / 2, ny * cellSize + cellSize / 2)
                    ctx!.stroke()
                }
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [cellSize, stepsPerFrame, running, showLabels])

    return (
        <canvas
            ref={ref}
            width={WIDTH * cellSize}
            height={HEIGHT * cellSize}
            style={{ background: '#0b0d12', imageRendering: 'pixelated' }}
        />
    )
}
