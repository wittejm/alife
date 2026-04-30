// In-app writeup for the Squirm3 page.
// Uses inline SVG diagrams + Unicode/HTML math (no KaTeX dep).

const COLORS: Record<string, string> = {
    a: '#ef4444', b: '#22c55e', c: '#3b82f6',
    d: '#eab308', e: '#a855f7', f: '#06b6d4',
}

function AtomDot({ type, state, x, y, r = 14 }: { type: string; state: number; x: number; y: number; r?: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r} fill={COLORS[type] ?? '#888'} stroke="#fff" strokeWidth={1} />
            <text x={x} y={y + 0.5} fill="#000" fontSize={14} fontWeight={700}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily="ui-monospace, monospace">
                {type}{state}
            </text>
        </g>
    )
}

function ReactionDiagram({ left, right, title }: {
    left: { a: { type: string; state: number }; b: { type: string; state: number }; bonded: boolean }
    right: { a: { type: string; state: number }; b: { type: string; state: number }; bonded: boolean }
    title: string
}) {
    return (
        <svg viewBox="0 0 400 70" width="100%" style={{ maxWidth: 400 }}>
            <text x={0} y={10} fill="#aaa" fontSize={11} fontFamily="ui-monospace, monospace">{title}</text>
            <AtomDot type={left.a.type} state={left.a.state} x={30} y={45} />
            {left.bonded && <line x1={44} y1={45} x2={76} y2={45} stroke="#fff" strokeWidth={1.5} />}
            {!left.bonded && <text x={60} y={50} fill="#888" fontSize={18} textAnchor="middle">+</text>}
            <AtomDot type={left.b.type} state={left.b.state} x={90} y={45} />
            <text x={155} y={50} fill="#aaa" fontSize={20} textAnchor="middle">→</text>
            <AtomDot type={right.a.type} state={right.a.state} x={210} y={45} />
            {right.bonded && <line x1={224} y1={45} x2={256} y2={45} stroke="#fff" strokeWidth={1.5} />}
            {!right.bonded && <text x={240} y={50} fill="#888" fontSize={18} textAnchor="middle">+</text>}
            <AtomDot type={right.b.type} state={right.b.state} x={270} y={45} />
        </svg>
    )
}

function ChainDiagram() {
    const chain = [
        { type: 'e', state: 8 },
        { type: 'a', state: 1 },
        { type: 'b', state: 1 },
        { type: 'c', state: 1 },
        { type: 'd', state: 1 },
        { type: 'f', state: 1 },
    ]
    return (
        <svg viewBox="0 0 380 50" width="100%" style={{ maxWidth: 380 }}>
            {chain.map((a, i) => (
                <g key={i}>
                    {i > 0 && (
                        <line x1={i * 60 - 16} y1={25} x2={i * 60 + 16} y2={25} stroke="#fff" strokeWidth={1.5} />
                    )}
                    <AtomDot type={a.type} state={a.state} x={i * 60 + 30} y={25} />
                </g>
            ))}
        </svg>
    )
}

const eq = (s: string) => (
    <code style={{ background: '#1a1d24', padding: '2px 6px', borderRadius: 3, fontSize: 13 }}>{s}</code>
)

const block = (s: string) => (
    <pre style={{ background: '#1a1d24', padding: 10, borderRadius: 4, fontSize: 13, overflow: 'auto', margin: '6px 0' }}>{s}</pre>
)

export function Squirm3Writeup() {
    return (
        <div className="writeup">
            <h2>What you're looking at</h2>
            <p>
                A 2D toroidal grid of atoms. Each cell is empty or holds at most one atom. An atom has a fixed
                <em> type</em> ∈ {'{a, b, c, d, e, f}'} (color) and a mutable <em>state</em> ∈ {'{0,1,…,9}'} (the digit
                next to the letter). White lines are <em>bonds</em> — physical connections between adjacent atoms.
                A connected cluster of bonded atoms is a <em>molecule</em>.
            </p>
            <p>
                The seeded chain is a polymer of the form <code>e8–a1–b1–c1–d1–f1</code>, with an <code>e8</code> head
                and an <code>f1</code> tail. Under the 8-rule chemistry below, this kind of chain replicates by templating
                from the surrounding soup of state-0 atoms.
            </p>
            <ChainDiagram />

            <h2>Formal state</h2>
            <p>The world is a configuration {eq('σ : G → (T × S) ⊔ {⊥}')} (one atom per cell, or empty), plus a bond relation:</p>
            {block(`B ⊆ { (p, q) :  σ(p), σ(q) ≠ ⊥,  ‖p − q‖∞ = 1 }`)}
            <p>
                Bonds only exist between atoms in adjacent cells (Moore neighborhood, ≤1 cell apart in any direction).
                Atom type is fixed for life; state and bond-membership change.
            </p>

            <h2>Reactions</h2>
            <p>
                A reaction is a rewrite rule on a pair of atoms in the von Neumann (4-) neighborhood. Notation:
            </p>
            {block(`t₁ s₁  □  t₂ s₂   →   t₁ s₁'  □'  t₂ s₂'`)}
            <p>
                where <code>□</code> is <code>+</code> (unbonded) or juxtaposition (bonded). Lowercase{' '}
                <code>x</code>, <code>y</code> are <em>type variables</em> over <code>{'{a..f}'}</code> — within
                one rule, every <code>x</code> means the same type. The 8 rules from Hutton (2002):
            </p>
            <ReactionDiagram title="R1: e8 + e0 → e4–e3   (head primes onto a free e atom)"
                left={{ a: { type: 'e', state: 8 }, b: { type: 'e', state: 0 }, bonded: false }}
                right={{ a: { type: 'e', state: 4 }, b: { type: 'e', state: 3 }, bonded: true }} />
            <ReactionDiagram title="R2: x4–y1 → x2–y5   (signal propagates one step down the chain)"
                left={{ a: { type: 'a', state: 4 }, b: { type: 'b', state: 1 }, bonded: true }}
                right={{ a: { type: 'a', state: 2 }, b: { type: 'b', state: 5 }, bonded: true }} />
            <ReactionDiagram title="R3: x5 + x0 → x7–x6   (a new same-type atom bonds in)"
                left={{ a: { type: 'a', state: 5 }, b: { type: 'a', state: 0 }, bonded: false }}
                right={{ a: { type: 'a', state: 7 }, b: { type: 'a', state: 6 }, bonded: true }} />
            <ReactionDiagram title="R6: f4–f3 → f8 + f8   (tail strands separate)"
                left={{ a: { type: 'f', state: 4 }, b: { type: 'f', state: 3 }, bonded: true }}
                right={{ a: { type: 'f', state: 8 }, b: { type: 'f', state: 8 }, bonded: false }} />

            <p>The full table:</p>
            {block(`R1:  e8 + e0  →  e4 e3
R2:  x4 y1     →  x2 y5
R3:  x5 + x0  →  x7 x6
R4:  x3 + y6  →  x2 y3
R5:  x7 y3     →  x4 y3
R6:  f4 f3     →  f8 + f8
R7:  x2 y8     →  x9 y1
R8:  x9 y9     →  x8 + y8`)}

            <p>
                With type variables expanded over <code>{'{a..f}'}</code>, these 8 polymorphic rules are 188 ground
                rules. For an n-base alphabet the count needed for replication is {eq('5n² + 21n + 4')}.
            </p>

            <h2>Update step</h2>
            <p>One simulation tick consists of:</p>
            <ol>
                <li>
                    <strong>Reaction phase</strong> — for each pair of 4-adjacent occupied cells, apply at most one
                    matching rule. We do four disjoint sweeps (horizontal even, horizontal odd, vertical even,
                    vertical odd) so each pair is processed exactly once.
                </li>
                <li>
                    <strong>Movement phase</strong> — each atom (in random order) tries to move to a uniformly chosen
                    Moore-neighbor cell. The move is accepted iff the cell is empty <em>and</em> every atom currently
                    bonded to it remains within Chebyshev distance 1 after the move. Bonds may stretch over diagonals
                    but no further.
                </li>
            </ol>
            <p>
                The asymmetry — reactions on the 4-neighborhood, movement on the 8-neighborhood — is what lets
                ring-shaped molecules act as proto-membranes. Atoms touch diagonally in the bond graph but don't
                react with their interior contents.
            </p>

            <h2>What to watch for</h2>
            <ul>
                <li>
                    <strong>Initial spike of R1.</strong> The e8 head finds an e0 in the soup and bonds (e4–e3).
                    Then R2 propagates a "4" signal down the chain, R3 picks up complementary atoms, R5 resets
                    intermediate states. Watch the chain "extrude" a copy alongside itself.
                </li>
                <li>
                    <strong>R6 is the unzip.</strong> The f tails separate when both reach state 4 and 3 — that's the
                    moment one chain becomes two.
                </li>
                <li>
                    <strong>Length statistics drift downward.</strong> Hutton's experiments show that in a finite world,
                    shorter copies outcompete longer ones because they spread before resources run out. The seeded
                    length-6 chain becomes a length-2 dominant species over time.
                </li>
                <li>
                    <strong>Then nothing.</strong> Once the shortest viable replicator dominates, evolution stops.
                    The four backbone bases <code>{'{a, b, c, d}'}</code> are <em>property-identical</em> — every
                    sequence of any base composition has the same fitness. Heredity without expression. This is the
                    point of running it: see the ceiling, not break it.
                </li>
            </ul>

            <h2>Why we built this</h2>
            <p>
                Squirm3 is a known-replicator substrate. We don't expect it to host OEE — Hutton was explicit that the
                base alphabet is inert and selection has nowhere to go. But it's the cleanest published "molecules
                emerge from atoms" demo, so it's the right testbench for the tier-detection oracle: if an oracle
                can't recognize molecules-as-units in this soup, the oracle is broken. It's a unit test for the math
                that comes next.
            </p>
            <p>
                The next substrate after this drops the polymorphic <code>x, y</code> variables: each atom type gets
                its own intrinsic bonding rules and reactivities, so sequence affects local chemistry directly with
                no separate translation layer. That's where the OEE hunt actually starts.
            </p>

            <h2>Reading</h2>
            <p>
                Hutton, T. J. (2002).{' '}
                <a href="https://faculty.cc.gatech.edu/~turk/bio_sim/articles/hutton_rep_molecules.pdf"
                   target="_blank" rel="noopener noreferrer">
                    Evolvable self-replicating molecules in an artificial chemistry
                </a>. <em>Artificial Life</em> 8(4): 341–356. §2 specifies the world. §4 specifies the CA update.
                §5.1 maps the OEE frontier above this substrate.
            </p>
        </div>
    )
}
