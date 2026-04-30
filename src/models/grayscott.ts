const HEIGHT = 256
const WIDTH = 256

const Du = 0.16
const Dv = 0.08
const dt = 1.0

const TAU_SEEDS = 24
const tauEatMu = 2.0

export let U: number[][]
export let V: number[][]
export let tau: number[][]
export let gradTauSq: number[][]

let Unext: number[][]
let Vnext: number[][]

let useTauFlag = false

export function isUsingTau() {
    return useTauFlag
}

export function setUseTau(on: boolean) {
    useTauFlag = on
    if (on && !tau) generateTau()
}

function allocScratch() {
    Unext = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
    Vnext = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
}

function generateTau() {
    const seeds: { x: number; y: number; t: number }[] = []
    for (let n = 0; n < TAU_SEEDS; n++) {
        seeds.push({
            x: Math.floor(Math.random() * WIDTH),
            y: Math.floor(Math.random() * HEIGHT),
            t: Math.random(),
        })
    }
    tau = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            let bestD = Infinity
            let bestT = 0
            for (const s of seeds) {
                let dx = Math.abs(s.x - j)
                if (dx > WIDTH / 2) dx = WIDTH - dx
                let dy = Math.abs(s.y - i)
                if (dy > HEIGHT / 2) dy = HEIGHT - dy
                const d = dx * dx + dy * dy
                if (d < bestD) {
                    bestD = d
                    bestT = s.t
                }
            }
            tau[i][j] = bestT
        }
    }
    gradTauSq = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
    for (let i = 0; i < HEIGHT; i++) {
        const im = (i - 1 + HEIGHT) % HEIGHT
        const ip = (i + 1) % HEIGHT
        for (let j = 0; j < WIDTH; j++) {
            const jm = (j - 1 + WIDTH) % WIDTH
            const jp = (j + 1) % WIDTH
            const dx = (tau[i][jp] - tau[i][jm]) / 2
            const dy = (tau[ip][j] - tau[im][j]) / 2
            gradTauSq[i][j] = dx * dx + dy * dy
        }
    }
}

export function regenerateTau() {
    generateTau()
}

export function initRandom() {
    U = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => Math.random()))
    V = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => Math.random()))
    allocScratch()
}

export function initBlob() {
    U = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1))
    V = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
    const cy = HEIGHT >> 1
    const cx = WIDTH >> 1
    const r = 10
    for (let y = cy - r; y < cy + r; y++) {
        for (let x = cx - r; x < cx + r; x++) {
            U[y][x] = 0.5
            V[y][x] = 0.25
        }
    }
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            U[y][x] += (Math.random() - 0.5) * 0.1
            V[y][x] += (Math.random() - 0.5) * 0.1
        }
    }
    allocScratch()
}

export function initMultiBlob() {
    U = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1))
    V = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
    const r = 8
    for (let n = 0; n < 5; n++) {
        const cy = Math.floor(Math.random() * HEIGHT)
        const cx = Math.floor(Math.random() * WIDTH)
        for (let dy = -r; dy < r; dy++) {
            for (let dx = -r; dx < r; dx++) {
                const y = (cy + dy + HEIGHT) % HEIGHT
                const x = (cx + dx + WIDTH) % WIDTH
                U[y][x] = 0.5
                V[y][x] = 0.25
            }
        }
    }
    allocScratch()
}

export function initStripe() {
    U = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1))
    V = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
    const cy = HEIGHT >> 1
    const half = 6
    for (let y = cy - half; y < cy + half; y++) {
        for (let x = 0; x < WIDTH; x++) {
            U[y][x] = 0.5
            V[y][x] = 0.25
        }
    }
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            U[y][x] += (Math.random() - 0.5) * 0.01
            V[y][x] += (Math.random() - 0.5) * 0.01
        }
    }
    allocScratch()
}

export function update(F: number, k: number) {
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            const im = (i - 1 + HEIGHT) % HEIGHT
            const ip = (i + 1) % HEIGHT
            const jm = (j - 1 + WIDTH) % WIDTH
            const jp = (j + 1) % WIDTH

            const u = U[i][j]
            const v = V[i][j]

            const lapU = U[im][j] + U[ip][j] + U[i][jm] + U[i][jp] - 4 * u
            const lapV = V[im][j] + V[ip][j] + V[i][jm] + V[i][jp] - 4 * v

            const reaction = u * v * v

            // Boundary-eating: V destroyed at τ-region boundaries, mass returned to U.
            const eat = useTauFlag ? tauEatMu * gradTauSq[i][j] * v * v : 0

            Unext[i][j] = u + dt * (Du * lapU - reaction + F * (1 - u) + eat)
            Vnext[i][j] = v + dt * (Dv * lapV + reaction - (F + k) * v - eat)
        }
    }

    ;[U, Unext] = [Unext, U]
    ;[V, Vnext] = [Vnext, V]
}

// Default initial state at module load so U/V are valid before the UI runs
initBlob()
