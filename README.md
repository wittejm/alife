# alife

An artificial life sandbox aimed at finding **two-tier emergent behavior**: simple base units whose dynamics give rise to probabilistically-stable tier-1 units, whose dynamics in turn give rise to probabilistically-stable tier-2 units.

## Goals

- **Two tiers of emergence.** Not just patterns, but a hierarchy: persistent units at one scale that themselves behave as units at a coarser scale.
- **Probabilistic stability.** Tier-N units don't have to be exact — they need to be attractors of the dynamics, robust to noise.
- **Mathematical attractor detection.** Find tiers by analysis, not by eye, using whichever tool fits the substrate:
  - **Spectral / transfer-operator analysis** of the state-transition operator (leading eigenvectors → metastable basins; spectral gap on the coarsened process → tier-2 test).
  - **Latent-variable model fitting** (EM on an HMM where hidden states = basin labels; likelihood vs. a flat baseline tells you whether tier structure exists).
  - **MCMC / Gibbs sampling** — many stochastic substrates already *are* Gibbs samplers of their stationary distribution; its modes are the attractors. Also useful for sampling typical configurations within a basin.
  - **Clustering & slow-coordinate methods** (PCCA+, tICA, SINDy) for collapsing high-dimensional trajectories into discrete units and slow collective variables.
- **Open-ended parameter search.** Once a tier-score is defined, search the rule/parameter space with whatever heuristic fits: MCMC over a tier-score posterior, EM when the score is a likelihood, evolutionary search, novelty search / quality-diversity (MAP-Elites), Bayesian optimization for expensive simulations.
- **Thermodynamic grounding.** The substrate should have an explicit energy/matter input that sustains structure against entropy — life-likeness in the Schrödinger sense, not just rule-driven pattern persistence.
- **Hands-on implementation.** Data structures and algorithms written from scratch, slowly, for understanding.
- **Sharable.** React + TypeScript + Vite, deployed to GitHub Pages, so anyone can open a link and see it run.

## Adaptive pressure

Two distinct mechanisms often conflated as "selection":

- **Competition for resources.** Shapes existing dynamics, produces ecology-like patterns. Does not by itself create new tiers.
- **Selection on heritable variation** (replication + mutation + competition). The mechanism behind every alife system that has cleanly produced three tiers (Tierra, Avida). Required for accumulating complexity across tiers.

The starting substrate has the first but not the second. We study tier-1 → tier-2 emergence under competition alone. To push for tier-3, the natural extensions are:

1. **Outer-loop selection on rules.** Sweep parameters and let a search heuristic concentrate on tier-2-scoring regions. Adaptive pressure on the rules, not the patterns. Free once the tier-score and search loop exist.
2. **Spatial parameter heterogeneity.** Make rule parameters local fields rather than constants. Patterns in favorable regions persist and spread, implicitly carrying parameters with them — heritability inside the substrate.
3. **Multi-species generalization.** More reactant species / interaction types, allowing speciation and mutation. Moves toward artificial-chemistry / RAF territory.

## Substrate: Gray–Scott reaction-diffusion

Two chemicals, **U** and **V**, on a 2D grid. They diffuse at different rates and react via `U + 2V → 3V` — V consumes U to make more V. U is fed in from outside at rate `F`; V is removed at rate `k`. The feed and kill terms are the entropy-fighting energy input.

```
∂U/∂t = D_u · ∇²U  −  U·V²  +  F·(1 − U)
∂V/∂t = D_v · ∇²V  +  U·V²  −  (F + k)·V
```

`∇²` (the Laplacian) is approximated as *(average of 4 neighbors) − (center)* — how different a cell is from its surroundings. Diffusion smooths; the `U·V²` term is the autocatalytic reaction.

In certain regions of `(F, k)` space the system produces self-replicating spots, traveling waves, and other long-lived structures. These spots are the tier-1 candidates; their collective behavior is where we'll hunt for tier-2.

Gray-Scott is a *known-capped* substrate. Two scalar concentration fields don't carry enough information per cell to encode a description-of-self, so it cannot host emergent genomes no matter how (F, k) is tuned. We keep it as a testbench for the tier-detection math — the math has to work on a substrate we already understand the ceiling of — but the substrate of record for the OEE hunt is the next one.

## Substrate: discrete artificial chemistry (Squirm3-style)

To clear the information-density ceiling, drop one tier and take **atoms with bonding rules** as primitive. Molecules emerge as bonded clusters of atoms; reactions emerge as bond-rearrangements when atoms collide. This puts us in artificial-chemistry territory and matches the README's tier-3 path #3 (multi-species generalization). The reference design is Tim Hutton's *Squirm3* (2002).

### State

Atom types `T = {a, b, c, d, e, f}`, atom states `S = {0, 1, …, 9}`. The world is a toroidal 2D grid `G = Z_W × Z_H`. The configuration is

```
σ : G → (T × S) ⊔ {⊥}                                            -- one atom per cell, or empty
B ⊆ { (p, q) : p, q ∈ G, σ(p), σ(q) ≠ ⊥, ‖p − q‖∞ = 1 }           -- bond relation
```

A **molecule** is a connected component of `(σ, B)`. An atom's *type* is fixed for life; its *state* and *bond membership* are mutable.

### Reactions

A reaction is a rewrite rule on a pair of atoms within the von Neumann (4-) neighborhood. Notation `t₁s₁ ☐ t₂s₂  →  t₁s₁' ☐' t₂s₂'` where `☐` is `+` (unbonded) or juxtaposition (bonded). The 8-rule chemistry from Hutton (2002, Table 1) — sufficient for self-replication of polymers `e8-{x1}*-f1`:

```
R1:  e8 + e0  →  e4e3        unbonded e/e bond and restate
R2:  x4y1     →  x2y5        bonded pair restates, stays bonded
R3:  x5 + x0  →  x7x6        same-type unbonded pair bonds
R4:  x3 + y6  →  x2y3        unbonded pair bonds
R5:  x7y3     →  x4y3        bonded; only one atom restates
R6:  f4f3     →  f8 + f8     bonded pair unbonds
R7:  x2y8     →  x9y1        bonded pair restates
R8:  x9y9     →  x8 + y8     bonded pair unbonds
```

Lowercase `x, y` are *type variables* over `T`; within a single rule each occurrence of `x` refers to the same type, similarly for `y`. R2 with `x = a, y = b` matches the bonded pair `a4-b1`, etc. The 8 polymorphic rules expand to 188 ground rules. For an `n`-base alphabet, `5n² + 21n + 4` rules suffice for templated replication (paper §2.3).

For `|T| = 6, |S| = 10` the space of (ordered, bond-status-distinguished) atom-pair contexts is `|T|² · |S|² · 2 = 7200`. A *chemistry* is a partial function from these contexts to `(next-states, next-bond)`; contexts outside its domain are null (no change).

### Update step

Each time step:

1. **Reaction phase.** For each pair of atoms at 4-adjacent cells, apply at most one matching rule. Implemented as 4 Margolus-style block sweeps over disjoint pair-coverings, so the entire phase runs in parallel.
2. **Movement phase.** Each atom moves to a uniformly random empty Moore-neighbor cell, subject to: *every atom it is bonded to remains in its Moore neighborhood after the move* (bonds may stretch over diagonals but no further). Implemented as 9 Margolus block sweeps over a 3×3 tiling.

The asymmetry — reactions on the 4-neighborhood, movement on the 8-neighborhood — is load-bearing. Diagonal-only bonds let rings act as proto-membranes: atoms in a ring touch in the bond graph but don't react with their interior contents (Hutton §5.1, Fig. 11).

### Conservation laws

- Atom count is conserved (no creation/destruction in the basic model).
- Each atom's type is conserved.
- Energy is *not* explicitly modeled; the analog is supply of state-0 raw material. Two boundary mechanisms inject negentropy:
  - **Cosmic ray:** with probability `p_cosmic` per atom per step, an atom's state is randomized (type and bonds preserved). Hutton uses `p_cosmic = 10⁻⁵`.
  - **Flood:** every `T_flood` steps, half the grid is replaced by random atoms in state 0. Hutton uses `T_flood = 10⁴`.

### Empirical results (Hutton 2002)

- 20×20 grid, 75 extra atoms, seed length-4 chain → 11 copies after 3,544 iterations.
- 100×100 grid, *no seed*, `p_cosmic = 10⁻⁵`, flood `T = 10⁴` → spontaneous emergence of replicators around iteration 4×10⁵; reaction rate jumps ~10× at appearance (autocatalysis signature).
- Under flood-selection pressure, replicator length monotonically decreases — shorter copies outcompete longer ones because they spread before the next flood.

### What this doesn't reach (and where we go from here)

The 4-base alphabet `{a, b, c, d}` is *informationally inert*: every base sequence has identical fitness. Squirm3 has heredity but no expression — bases carry no function. After selection picks the shortest viable replicator, evolution stops. Hutton is explicit about this ceiling (§5.1).

For OEE the bases must *do* something. The polymer needs to template "proteins" — secondary molecules whose specificity depends on the parent's base sequence — which then catalyze reactions in the surrounding chemistry. This is von Neumann's universal-constructor structure (description tape + interpreter) at chemistry scale. It is the open frontier and the natural target for our extensions on top of Squirm3.

### Variants and successors

- Hutton (2007), *Evolvable Self-Reproducing Cells in a Two-Dimensional Artificial Chemistry* — Squirm3 + membranes + cell division.
- Hatcher, Banzhaf & Yu (2011), *Bondable Cellular Automata* — generalizes the atoms-with-bonds CA formalism.
- Dittrich, Ziegler & Banzhaf (2001), *Artificial Chemistries — A Review* — definitional landscape `(S, R, A)`; Squirm3 sits in the molecule-and-collision tradition.
- Ono & Ikegami's membrane chemistries; JohnnyVon's continuous-space bonded codons — orthogonal substrates worth knowing.

## Reading

The detailed paper to start with: **Hutton, T. J. (2002). Evolvable self-replicating molecules in an artificial chemistry.** *Artificial Life* 8(4): 341–356.

- PDF: https://faculty.cc.gatech.edu/~turk/bio_sim/articles/hutton_rep_molecules.pdf
- DOI: 10.1162/106454602321202417
- Source + live demo: https://github.com/timhutton/squirm3 · https://timhutton.github.io/squirm3

§2 specifies the world, atoms, bonds, and reaction language. §4 specifies the CA update. §5.1 is the most important section — Hutton honestly maps what the basic chemistry can and cannot reach, and points toward the universal-constructor extension that's the actual OEE target.

## Stack

- React 19 + TypeScript + Vite
- Simulation state in `Float32Array` (U, V, plus scratch buffers for double-buffered updates)
- Canvas + `ImageData` as the render target, populated from U/V via a colormap each frame
- Deploy: GitHub Actions → GitHub Pages on push to `main`

