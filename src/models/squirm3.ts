// Minimal Squirm3 (Hutton 2002).
// 6 types, 10 states, 8 polymorphic rules.

export type AtomType = 'a' | 'b' | 'c' | 'd' | 'e' | 'f'
export type Atom = { type: AtomType; state: number }

export const WIDTH = 64
export const HEIGHT = 64

const TYPES: AtomType[] = ['a', 'b', 'c', 'd', 'e', 'f']

type Pat = { type: string; state: number } // type may be 'a'..'f' literal or 'x'/'y' variable
type Rule = { la: Pat; lb: Pat; lBonded: boolean; ra: Pat; rb: Pat; rBonded: boolean; name: string }

export const RULES: Rule[] = [
    { name: 'R1', la: { type: 'e', state: 8 }, lb: { type: 'e', state: 0 }, lBonded: false,
                  ra: { type: 'e', state: 4 }, rb: { type: 'e', state: 3 }, rBonded: true },
    { name: 'R2', la: { type: 'x', state: 4 }, lb: { type: 'y', state: 1 }, lBonded: true,
                  ra: { type: 'x', state: 2 }, rb: { type: 'y', state: 5 }, rBonded: true },
    { name: 'R3', la: { type: 'x', state: 5 }, lb: { type: 'x', state: 0 }, lBonded: false,
                  ra: { type: 'x', state: 7 }, rb: { type: 'x', state: 6 }, rBonded: true },
    { name: 'R4', la: { type: 'x', state: 3 }, lb: { type: 'y', state: 6 }, lBonded: false,
                  ra: { type: 'x', state: 2 }, rb: { type: 'y', state: 3 }, rBonded: true },
    { name: 'R5', la: { type: 'x', state: 7 }, lb: { type: 'y', state: 3 }, lBonded: true,
                  ra: { type: 'x', state: 4 }, rb: { type: 'y', state: 3 }, rBonded: true },
    { name: 'R6', la: { type: 'f', state: 4 }, lb: { type: 'f', state: 3 }, lBonded: true,
                  ra: { type: 'f', state: 8 }, rb: { type: 'f', state: 8 }, rBonded: false },
    { name: 'R7', la: { type: 'x', state: 2 }, lb: { type: 'y', state: 8 }, lBonded: true,
                  ra: { type: 'x', state: 9 }, rb: { type: 'y', state: 1 }, rBonded: true },
    { name: 'R8', la: { type: 'x', state: 9 }, lb: { type: 'y', state: 9 }, lBonded: true,
                  ra: { type: 'x', state: 8 }, rb: { type: 'y', state: 8 }, rBonded: false },
]

export let grid: (Atom | null)[] = new Array(WIDTH * HEIGHT).fill(null)
const bonds = new Set<string>()
export let stepCount = 0

function idx(x: number, y: number): number { return y * WIDTH + x }
function bondKey(i: number, j: number): string { return i < j ? `${i}-${j}` : `${j}-${i}` }
export function hasBond(i: number, j: number): boolean { return bonds.has(bondKey(i, j)) }
function addBond(i: number, j: number) { bonds.add(bondKey(i, j)) }
function removeBond(i: number, j: number) { bonds.delete(bondKey(i, j)) }

export function getBonds(): string[] { return Array.from(bonds) }

function bondedNeighbors(i: number): number[] {
    const x = i % WIDTH, y = Math.floor(i / WIDTH)
    const out: number[] = []
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = (x + dx + WIDTH) % WIDTH, ny = (y + dy + HEIGHT) % HEIGHT
            const j = idx(nx, ny)
            if (grid[j] && hasBond(i, j)) out.push(j)
        }
    }
    return out
}

function chebyToroidal(ax: number, ay: number, bx: number, by: number): number {
    let dx = Math.abs(ax - bx); if (dx > WIDTH / 2) dx = WIDTH - dx
    let dy = Math.abs(ay - by); if (dy > HEIGHT / 2) dy = HEIGHT - dy
    return Math.max(dx, dy)
}

// Try to match `rule` with atom-pair (a at side L, b at side R), bonded?
// Returns next-states-and-bond if it matches, else null.
function matchRule(
    rule: Rule, a: Atom, b: Atom, bonded: boolean,
): { sa: number; sb: number; bond: boolean } | null {
    if (rule.lBonded !== bonded) return null
    if (rule.la.state !== a.state) return null
    if (rule.lb.state !== b.state) return null
    const bind: Record<string, AtomType> = {}
    function check(pat: string, t: AtomType): boolean {
        if (pat === 'x' || pat === 'y') {
            if (bind[pat] && bind[pat] !== t) return false
            bind[pat] = t
            return true
        }
        return pat === t
    }
    if (!check(rule.la.type, a.type)) return null
    if (!check(rule.lb.type, b.type)) return null
    return { sa: rule.ra.state, sb: rule.rb.state, bond: rule.rBonded }
}

function tryReaction(i: number, j: number) {
    const a = grid[i], b = grid[j]
    if (!a || !b) return
    const bonded = hasBond(i, j)
    for (const rule of RULES) {
        const m = matchRule(rule, a, b, bonded)
        if (m) {
            grid[i] = { type: a.type, state: m.sa }
            grid[j] = { type: b.type, state: m.sb }
            if (m.bond && !bonded) addBond(i, j)
            else if (!m.bond && bonded) removeBond(i, j)
            return
        }
        const m2 = matchRule(rule, b, a, bonded)
        if (m2) {
            grid[j] = { type: b.type, state: m2.sa }
            grid[i] = { type: a.type, state: m2.sb }
            if (m2.bond && !bonded) addBond(i, j)
            else if (!m2.bond && bonded) removeBond(i, j)
            return
        }
    }
}

// 4 disjoint pair-sweeps: horizontal even/odd, vertical even/odd.
function reactionPhase() {
    for (const horiz of [true, false]) {
        for (const parity of [0, 1]) {
            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    const offset = horiz ? x : y
                    if (offset % 2 !== parity) continue
                    const dx = horiz ? 1 : 0
                    const dy = horiz ? 0 : 1
                    const i = idx(x, y)
                    const j = idx((x + dx) % WIDTH, (y + dy) % HEIGHT)
                    tryReaction(i, j)
                }
            }
        }
    }
}

function movementPhase() {
    const occupied: number[] = []
    for (let i = 0; i < grid.length; i++) if (grid[i]) occupied.push(i)
    // Shuffle
    for (let n = occupied.length - 1; n > 0; n--) {
        const k = Math.floor(Math.random() * (n + 1))
        const tmp = occupied[n]; occupied[n] = occupied[k]; occupied[k] = tmp
    }
    for (const i of occupied) {
        if (!grid[i]) continue
        const x = i % WIDTH, y = Math.floor(i / WIDTH)
        const dx = Math.floor(Math.random() * 3) - 1
        const dy = Math.floor(Math.random() * 3) - 1
        if (dx === 0 && dy === 0) continue
        const nx = (x + dx + WIDTH) % WIDTH, ny = (y + dy + HEIGHT) % HEIGHT
        const j = idx(nx, ny)
        if (grid[j]) continue
        const partners = bondedNeighbors(i)
        let valid = true
        for (const p of partners) {
            const px = p % WIDTH, py = Math.floor(p / WIDTH)
            if (chebyToroidal(nx, ny, px, py) > 1) { valid = false; break }
        }
        if (!valid) continue
        // Move; rebond keys.
        grid[j] = grid[i]
        grid[i] = null
        for (const p of partners) {
            bonds.delete(bondKey(i, p))
            bonds.add(bondKey(j, p))
        }
    }
}

export function step() {
    reactionPhase()
    movementPhase()
    stepCount++
}

export function init(opts: { seed?: boolean; soupCount?: number } = {}) {
    grid = new Array(WIDTH * HEIGHT).fill(null)
    bonds.clear()
    stepCount = 0
    if (opts.seed !== false) {
        // Seed e8-a1-b1-c1-d1-f1 horizontally near center
        const cy = HEIGHT >> 1
        const cx0 = WIDTH >> 2
        const chain: Atom[] = [
            { type: 'e', state: 8 },
            { type: 'a', state: 1 },
            { type: 'b', state: 1 },
            { type: 'c', state: 1 },
            { type: 'd', state: 1 },
            { type: 'f', state: 1 },
        ]
        for (let i = 0; i < chain.length; i++) {
            const cellIdx = idx(cx0 + i, cy)
            grid[cellIdx] = chain[i]
            if (i > 0) addBond(idx(cx0 + i - 1, cy), cellIdx)
        }
    }
    const soup = opts.soupCount ?? 600
    let placed = 0
    while (placed < soup) {
        const x = Math.floor(Math.random() * WIDTH)
        const y = Math.floor(Math.random() * HEIGHT)
        const k = idx(x, y)
        if (grid[k]) continue
        const t = TYPES[Math.floor(Math.random() * TYPES.length)]
        grid[k] = { type: t, state: 0 }
        placed++
    }
}

// Count molecules by union-find over bonds.
export function moleculeStats(): { atoms: number; bonds: number; molecules: number; maxSize: number } {
    const parent: Record<number, number> = {}
    function find(i: number): number {
        if (parent[i] === undefined) parent[i] = i
        if (parent[i] === i) return i
        return (parent[i] = find(parent[i]))
    }
    function union(i: number, j: number) {
        const ri = find(i), rj = find(j)
        if (ri !== rj) parent[ri] = rj
    }
    let atomCount = 0
    for (let i = 0; i < grid.length; i++) if (grid[i]) { atomCount++; find(i) }
    for (const k of bonds) {
        const [a, b] = k.split('-').map(Number)
        union(a, b)
    }
    const sizes: Record<number, number> = {}
    for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
            const r = find(i)
            sizes[r] = (sizes[r] ?? 0) + 1
        }
    }
    const sizeArr = Object.values(sizes)
    const multi = sizeArr.filter(s => s > 1).length
    return {
        atoms: atomCount,
        bonds: bonds.size,
        molecules: multi,           // count of multi-atom clusters
        maxSize: sizeArr.length ? Math.max(...sizeArr) : 0,
    }
}

init()
