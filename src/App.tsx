import { useState } from 'react'
import { Field } from './components/Field'
import {
  initBlob,
  initMultiBlob,
  initStripe,
  initRandom,
} from './models/grayscott'
import './App.css'

const PRESETS = [
  { label: 'Spots', F: 0.04, k: 0.063 },
  { label: 'Mitosis', F: 0.014, k: 0.054 },
  { label: 'Maze', F: 0.029, k: 0.057 },
  { label: 'Solitons', F: 0.03, k: 0.062 },
  { label: 'Stripes', F: 0.022, k: 0.051 },
  { label: 'Coral', F: 0.0545, k: 0.062 },
]

const INITS = [
  { label: 'Center blob', fn: initBlob },
  { label: 'Multi blobs', fn: initMultiBlob },
  { label: 'Stripe', fn: initStripe },
  { label: 'Random', fn: initRandom },
]

export default function App() {
  const [F, setF] = useState(0.04)
  const [k, setK] = useState(0.063)
  const [stepsPerFrame, setStepsPerFrame] = useState(10)
  const [running, setRunning] = useState(true)

  return (
    <div className="app">
      <h1>Gray–Scott reaction-diffusion</h1>
      <Field
        width={256}
        height={256}
        scale={2}
        F={F}
        k={k}
        stepsPerFrame={stepsPerFrame}
        running={running}
      />
      <div className="controls">
        <div className="row">
          <button onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() =>
              setStepsPerFrame((s) => Math.max(1, Math.floor(s / 2)))
            }
          >
            Slower
          </button>
          <span className="metric">steps/frame: {stepsPerFrame}</span>
          <button
            onClick={() => setStepsPerFrame((s) => Math.min(200, s * 2))}
          >
            Faster
          </button>
        </div>

        <div className="row">
          <span className="label">Pattern:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setF(p.F)
                setK(p.k)
              }}
              className={F === p.F && k === p.k ? 'active' : ''}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="row">
          <span className="label">Initial state:</span>
          {INITS.map((i) => (
            <button key={i.label} onClick={i.fn}>
              {i.label}
            </button>
          ))}
        </div>

        <div className="row dim">
          F = {F.toFixed(4)}, k = {k.toFixed(4)}
        </div>
      </div>
    </div>
  )
}
