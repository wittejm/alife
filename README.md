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

## Stack

- React 19 + TypeScript + Vite
- Simulation state in `Float32Array` (U, V, plus scratch buffers for double-buffered updates)
- Canvas + `ImageData` as the render target, populated from U/V via a colormap each frame
- Deploy: GitHub Actions → GitHub Pages on push to `main`
