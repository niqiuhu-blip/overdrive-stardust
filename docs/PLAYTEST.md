# Playtest Notes

## 2026-08-20

### Original prototype
Positive:
- Continuous kill-to-dash feedback is the central pleasure.
- A successful aggressive action directly feeds the next aggressive action.
- Dash combining movement, offense, defense, and routing is the strongest part of the design.

### Early rebalance
Negative:
- Reducing ordinary enemy energy below one-dash payback made the game noticeably less satisfying.
Decision:
- Restore the “one kill pays back one dash” economy.
- Multi-kill should be the point where the player gains net Dash capacity.

### Nova / Flux
Positive:
- Separating Nova charge from kill energy made the resource roles clearer.
Decision:
- Graze feeds Flux.
- Pulse costs 25 Flux and is local utility.
- Full Nova costs 100 Flux and is global utility.
- Nova should not become the main boss DPS tool.

### Stage select
Problem:
- Earlier menu input mixed selection and start behavior, especially pointer input and game-over retry state.
Decision:
- Selection and confirmation are separate states/actions.

### Stage 2 — LINK experiment
Negative:
- The player did not need LINK gates to enjoy or clear the stage.
- LINK gates pulled attention away from the immediate kill/dash flow.
- Strong enemy aim assist could pull a Dash away from the precise gate path.
- Fixing aim assist for LINK would damage the base control feel.

Decision:
- Remove runtime LINK gates.
- Keep strong aim assist.
- Move Stage 2 identity to FORMATION: enemy geometry itself creates attractive Dash lines.

### Stage 3 direction
Accepted concept:
- Flow field as environmental modifier.
- It should affect outcomes but never steal directional control.
- Pulsar boss uses inhale / exhale / polarity states.
