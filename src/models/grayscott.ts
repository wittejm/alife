const H = 256
const W = 256

const Du = 0.16
const Dv = 0.08
const dt = 1.0

export let U: number[][]
export let V: number[][]

let Unext: number[][]
let Vnext: number[][]


function allocScratch() {
    Unext = Array.from({ length: H }, () => Array(W).fill(0))
    Vnext = Array.from({ length: H }, () => Array(W).fill(0))
}

export function initRandom() {
    U = Array.from({ length: H }, () => Array.from({ length: W }, () => Math.random()))
    V = Array.from({ length: H }, () => Array.from({ length: W }, () => Math.random()))
    allocScratch()
}

export function initBlob() {
    U = Array.from({ length: H }, () => Array(W).fill(1))
    V = Array.from({ length: H }, () => Array(W).fill(0))
    const cy = H >> 1
    const cx = W >> 1
    const r = 10
    for (let y = cy - r; y < cy + r; y++) {
        for (let x = cx - r; x < cx + r; x++) {
            U[y][x] = 0.5
            V[y][x] = 0.25
        }
    }
    // small noise to break perfect symmetry
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            U[y][x] += (Math.random() - 0.5) * 0.01
            V[y][x] += (Math.random() - 0.5) * 0.01
        }
    }
    allocScratch()
}

export function initMultiBlob() {
    U = Array.from({ length: H }, () => Array(W).fill(1))
    V = Array.from({ length: H }, () => Array(W).fill(0))
    const r = 8
    for (let n = 0; n < 5; n++) {
        const cy = Math.floor(Math.random() * H)
        const cx = Math.floor(Math.random() * W)
        for (let dy = -r; dy < r; dy++) {
            for (let dx = -r; dx < r; dx++) {
                const y = (cy + dy + H) % H
                const x = (cx + dx + W) % W
                U[y][x] = 0.5
                V[y][x] = 0.25
            }
        }
    }
    allocScratch()
}

export function initStripe() {
    U = Array.from({ length: H }, () => Array(W).fill(1))
    V = Array.from({ length: H }, () => Array(W).fill(0))
    const cy = H >> 1
    const half = 6
    for (let y = cy - half; y < cy + half; y++) {
        for (let x = 0; x < W; x++) {
            U[y][x] = 0.5
            V[y][x] = 0.25
        }
    }
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            U[y][x] += (Math.random() - 0.5) * 0.01
            V[y][x] += (Math.random() - 0.5) * 0.01
        }
    }
    allocScratch()
}

export function update(F: number, k: number) {
    for (let i = 0; i < H; i++) {
        for (let j = 0; j < W; j++) {
            const im = (i - 1 + H) % H
            const ip = (i + 1) % H
            const jm = (j - 1 + W) % W
            const jp = (j + 1) % W

            const u = U[i][j]
            const v = V[i][j]

            const lapU = U[im][j] + U[ip][j] + U[i][jm] + U[i][jp] - 4 * u
            const lapV = V[im][j] + V[ip][j] + V[i][jm] + V[i][jp] - 4 * v

            const reaction = u * v * v

            Unext[i][j] = u + dt * (Du * lapU - reaction + F * (1 - u))
            Vnext[i][j] = v + dt * (Dv * lapV + reaction - (F + k) * v)
        }
    }

    ;[U, Unext] = [Unext, U]
    ;[V, Vnext] = [Vnext, V]
}

// Default initial state at module load so U/V are valid before the UI runs
initBlob()
