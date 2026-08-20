# Changelog

## v0.7 — Overdrive experiment

- Removed the hard cap from combo score scaling; very high combo now continues to matter with diminishing returns.
- Added hidden Momentum with four readable combat states: NORMAL, OVERDRIVE I, OVERDRIVE II, REDLINE.
- Higher Overdrive accelerates Director spawn supply and reduces dead time instead of buffing player combat stats.
- Overdrive pace is disabled for boss phases.
- Stage 2 formation lines now carry formation membership.
- Clearing a full tracked formation in one Dash triggers `FORMATION BREAK`:
  - score bonus;
  - strong Momentum gain;
  - next formation is pulled forward immediately.
- Formation Break does not inflate the actual Combo kill count.
- Added Overdrive HUD state and runtime test hooks.

## v0.6 — runtime branch

- Added three-stage selection.
- Kept Pulse at 25 Flux and full Nova at 100 Flux.
- Removed Stage 2 runtime LINK gate system.
- Rebuilt Stage 2 around Formation waves:
  - straight and diagonal lines;
  - guarded lines;
  - moving formations;
  - late REDLINE overlapping arrays.
- Added formation density throttling so unreadable enemy piles do not replace deliberate kill lines.
- Kept Twin Drive as Stage 2 boss, with relay-assisted alternating target chase.
- Added Stage 3 Stellar Current runtime:
  - stream;
  - dual current;
  - vortex;
  - turbulence.
- Flow modifies motion outcomes but does not rotate Dash input.
- Added Pulsar boss:
  - INHALE / EXHALE phases;
  - low-HP POLARITY phase;
  - Nova freezes flow and boss firing for 2.5 s instead of dealing boss damage.
- Extended stage-select and result UI to three stages.
- Added runtime hooks/tests for Stage 2 formations and Stage 3 flow/Pulsar behavior.

## v0.5

- Added 25-Flux Pulse.
- Added experimental Stage 2 runtime LINK gates.
- LINK experiment later rejected after playtest.

## v0.4

- Restored one-kill dash payback economy.
- Reworked stage-selection state logic.

## v0.3

- Added Stage 1 Stardust Core and Stage 2 Twin Drive prototypes.
