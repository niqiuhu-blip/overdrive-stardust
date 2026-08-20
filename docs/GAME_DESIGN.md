# Game Design

## Core loop

- Dash is the primary verb: movement, invulnerability, offense, and resource routing are compressed into one action.
- One ordinary kill should approximately pay back one dash charge.
- More than one kill in the same dash should create positive resource gain.
- Strong aim assist is part of the feel, especially for keyboard play. Do not weaken it to serve a stage gimmick.
- New stage mechanics should change the battlefield or enemy geometry, not add compulsory side objectives that interrupt killing flow.

## Flux system

- Graze is the primary Flux source.
- `Q` — Pulse: costs 25 Flux. Local bullet/trail clear with a very short forgiving window. No direct enemy or boss damage.
- `E` / `Shift` — Nova: costs 100 Flux. Large-scale utility/space control.
- Holding 100 Flux retains the score multiplier, so Pulse/Nova usage has opportunity cost.

## Stage 1 — Stardust Core

Identity: open-arena mixed combat.

- Gradually introduces Wisp, Spiker, Weaver, and Breaker.
- Boss: Stardust Core.
- Boss loop: remove orbiting shields, exploit vulnerability, repeat.
- Nova is utility: it helps break the shield layer and can extend a vulnerability window, but Dash remains the main boss damage source.

Design role: teach and validate the base Dash combat loop.

## Stage 2 — Formation

Identity: enemy geometry creates desirable kill lines.

Rejected direction:
- Runtime LINK gates are removed.
- Reason: they created a second objective that the player could ignore, distracted attention from killing, and conflicted with the strongest part of the current control feel.

Current direction:
- Enemies spawn in deliberate lines, diagonals, crosses, moving arrays, and overlapping late-stage formations.
- The player never has to “complete” a formation. The formation only makes a good Dash route visually and mechanically tempting.
- Later waves combine formations with Spiker fire, Weaver trail cutting, and Breaker disruption.

Boss: Twin Drive.
- Two cores alternate as the valid target.
- Relay enemies between them support long chained traversal.
- The boss is a route-reading and continuous-chase test, not a shield-break repeat.

Design role: teach the player to read and exploit geometric kill routes.

## Stage 3 — Stellar Current

Identity: the battlefield itself changes movement and projectile behavior.

Principles:
- Flow is environmental state, not a task.
- Flow must never rotate or replace the player’s chosen Dash direction.
- It may change Dash distance/speed outcome, normal movement drift, enemy drift, and projectile trajectories.
- Ignoring the flow remains viable; reading it well creates better routes.

Runtime progression:
1. Broad stream.
2. Opposed / dual current.
3. Vortex.
4. Turbulence.

Boss: Pulsar.
- Always damageable by Dash.
- Alternates `INHALE` and `EXHALE`, concentrating or dispersing enemies and projectiles.
- At low HP enters `POLARITY`, splitting the arena into opposing radial flow behavior along a rotating axis.
- Nova freezes the flow and boss firing briefly; it does not directly damage Pulsar.

Design role: test battlefield reading while preserving the same core action vocabulary.

## Design guardrails

Prefer:
- changes that generate better Dash decisions;
- enemy geometry and timing;
- systems that are optional to exploit but satisfying when understood;
- boss mechanics that reuse the same input vocabulary.

Avoid:
- mandatory side objectives unrelated to killing;
- mechanics that secretly override player direction;
- generic stat-upgrade bloat;
- adding active buttons without a clear role;
- weakening core aim assist to make a stage mechanic work.
