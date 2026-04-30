import { useEffect, useState } from 'react'
import { Field } from './components/Field'
import { Squirm3Field } from './components/Squirm3Field'
import { Squirm3Writeup } from './components/Squirm3Writeup'
import {
  initBlob,
  initMultiBlob,
  initStripe,
  initRandom,
  setUseTau,
  regenerateTau,
} from './models/grayscott'
import { init as squirmInit, moleculeStats, stepCount as squirmStepCount } from './models/squirm3'
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

type Page = 'grayscott' | 'squirm3'

export default function App() {
  const [page, setPage] = useState<Page>('grayscott')
  return (
    <>
      <nav className="nav">
        <strong style={{ color: '#e0d4ee', letterSpacing: 0.5 }}>alife</strong>
        <button className={`nav-link ${page === 'grayscott' ? 'active' : ''}`} onClick={() => setPage('grayscott')}>
          Gray–Scott
        </button>
        <button className={`nav-link ${page === 'squirm3' ? 'active' : ''}`} onClick={() => setPage('squirm3')}>
          Squirm3
        </button>
        <div className="nav-spacer" />
        <a href="https://github.com/timhutton/squirm3" target="_blank" rel="noopener noreferrer">
          ref ↗
        </a>
      </nav>
      {page === 'grayscott' ? <GrayScottPage /> : <Squirm3Page />}
    </>
  )
}

function GrayScottPage() {
  const [F, setF] = useState(0.04)
  const [k, setK] = useState(0.063)
  const [stepsPerFrame, setStepsPerFrame] = useState(10)
  const [running, setRunning] = useState(true)
  const [useTau, setUseTauState] = useState(false)

  function toggleTau() {
    const next = !useTau
    setUseTau(next)
    setUseTauState(next)
  }

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
        useTau={useTau}
      />
      <div className="controls">
        <div className="row">
          <button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Play'}</button>
          <button onClick={() => setStepsPerFrame((s) => Math.max(1, Math.floor(s / 2)))}>Slower</button>
          <span className="metric">steps/frame: {stepsPerFrame}</span>
          <button onClick={() => setStepsPerFrame((s) => Math.min(200, s * 2))}>Faster</button>
          <button onClick={toggleTau} className={useTau ? 'active' : ''}>τ: {useTau ? 'on' : 'off'}</button>
          {useTau && <button onClick={regenerateTau}>Re-roll τ</button>}
        </div>
        <div className="row">
          <span className="label">Pattern:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => { setF(p.F); setK(p.k) }} className={F === p.F && k === p.k ? 'active' : ''}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="row">
          <span className="label">Initial state:</span>
          {INITS.map((i) => (
            <button key={i.label} onClick={i.fn}>{i.label}</button>
          ))}
        </div>
        <div className="row dim">F = {F.toFixed(4)}, k = {k.toFixed(4)}</div>
      </div>
    </div>
  )
}

function Squirm3Page() {
  const [stepsPerFrame, setStepsPerFrame] = useState(2)
  const [running, setRunning] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [stats, setStats] = useState({ atoms: 0, bonds: 0, molecules: 0, maxSize: 0, step: 0 })

  // Poll molecule stats once per second so it doesn't dominate the render loop.
  useEffect(() => {
    const id = setInterval(() => {
      const s = moleculeStats()
      setStats({ ...s, step: squirmStepCount })
    }, 500)
    return () => clearInterval(id)
  }, [])

  function reset() {
    squirmInit({ seed: true, soupCount: 600 })
  }
  function resetEmpty() {
    squirmInit({ seed: false, soupCount: 600 })
  }

  return (
    <div className="app">
      <h1>Squirm3 — atoms, bonds, replication</h1>
      <Squirm3Field stepsPerFrame={stepsPerFrame} running={running} showLabels={showLabels} />
      <div className="controls">
        <div className="row">
          <button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Play'}</button>
          <button onClick={() => setStepsPerFrame((s) => Math.max(1, s - 1))}>Slower</button>
          <span className="metric">steps/frame: {stepsPerFrame}</span>
          <button onClick={() => setStepsPerFrame((s) => Math.min(20, s + 1))}>Faster</button>
          <button onClick={() => setShowLabels((v) => !v)} className={showLabels ? 'active' : ''}>
            Labels
          </button>
        </div>
        <div className="row">
          <span className="label">Reset:</span>
          <button onClick={reset}>Seeded chain + soup</button>
          <button onClick={resetEmpty}>Soup only (no replicator)</button>
        </div>
        <div className="row dim">
          step {stats.step} · atoms {stats.atoms} · bonds {stats.bonds} · molecules {stats.molecules} · max-size {stats.maxSize}
        </div>
      </div>
      <Squirm3Writeup />
    </div>
  )
}
