# APEX / Solo Turbo Trials

Play online: https://mwang1129.github.io/my-browser-game/

Open `dist/index.html` in Microsoft Edge or another modern browser. The game is a single self-contained HTML file with no dependencies or internet requirement.

## Controls

- W / Up: accelerate; brake while reversing
- S / Down: brake, then hold to reverse
- A / D or Left / Right: steer
- Space + turn: start a drift while moving; keep holding Space to charge it
- Release Space: fire the charged drift turbo
- S / Down is the brake; Space never applies braking
- E or the power-up HUD button: use one stored turbo power-up
- R: restart
- Escape: pause / resume

Touch buttons appear on narrow screens. Sound is optional.

## Drift technique

Hold W / Up + Space + A / Left or D / Right together to activate drift in the pressed direction. Key order does not matter, and activation works from rest as you accelerate. Turbo charge builds once moving above 8 m/s. The body rotates independently of the direction of travel as rear grip decreases. Keep holding Space; steering into the turn tightens it, countersteering catches and controls the slide, and releasing the steering key maintains the drift. Charge for 0.6 seconds for mini turbo, 1.25 seconds for super turbo, or 2.2 seconds for ultra turbo. Release Space to boost. Contact, takeoff, or releasing forward cancels the drift. Switching to the opposite direction selects that drift side and starts a new charge.

Collect glowing cyan-and-lime boxes to store turbo power-ups (up to three). Each box grants one power-up immediately; press E to use one whenever you choose. A turbo adds an immediate speed kick and three seconds of strong acceleration, raising the top speed from 90 to 145 m/s. Holding E uses only one power-up; release and press again to use another. Amber ramps launch the kart; tap Space within 0.35 seconds before a clean landing for a trick boost. Mint road markings indicate boost lines. Results show lap time, airtime, contacts, drift boosts, and tricks.

Amber chevrons lead up steep takeoff ramps into open gaps at least 160 metres long, with mint landing edges on the far side. Wings deploy automatically in the air and fold away on landing. Takeoff clears sideways drift while keeping your heading; there is no automatic steering toward the landing. A/D or Left/Right smoothly bank and turn the glide. Releasing steering lets the turn settle without continued sideways drift. A softer chase camera, subtle vertical movement, and wing banking give flight a floating feel. Glide speed is maintained without holding the accelerator. Missing a gap returns you to the approach with a two-second penalty. Jump locations favor straighter sections of each circuit.

Turn **Sound On** to hear background music and effects. The home screen has its own relaxed theme, and each of the 51 maps has a distinct generated melody, harmony, key/tempo combination, and arrangement. Music plays on the home screen and during races; music and effects stop while paused or muted. The engine uses a softer bass rumble and restrained acceleration pitch. Gliding brings forward a rushing-wind layer with gentle wing flutter.

Touchdown sweeps the wheels along their full motion between physics steps against the rendered road triangles, including slopes and shortcuts. This catches fast descents and rising road surfaces without clipping through them. Grounded wheels use the same surface geometry, so the kart does not sink on the frame after touchdown. Nearby lane heights cannot trigger a landing. Wings fold gradually and the chase camera eases back after contact rather than snapping to its ground position.

Landing contact includes the outside edges of the tyres, giving approximately 40 cm of extra sideways reach and 55 cm at the front/rear compared with wheel-centre checks. This helps close platform-edge landings without pulling the kart down from the air. Centre-screen messages and turbo headings use smaller type to leave the road visible.

Swept contact also catches rising roads while the kart is climbing. The visible landing-platform faces block jumps that arrive too low, and touching a jump-gap floor triggers missed-jump recovery immediately instead of passing through the floor. Gliding wind is mixed quietly beneath the music and other effects.

Finish a full lap by crossing the visible start/finish line forward, between its posts. Ordered course checkpoints preserve lap completion when gliding makes the nearest-road progress jump. Reaching the end of the progress bar alone does not finish the race. The clock stops at the crossing, including airborne crossings, before landing or wall corrections can move the kart. Reverse crossings and crossings outside the gate do not count. Results hide the driving controls, and Replay starts a fresh countdown.

A soft shadow follows the kart on the road, terrain, or floor of a jump gap. It spreads and fades with height to make airborne clearance easier to judge.

## Circuits

Explore 51 Circuits opens the atlas. There are 17 route families and 17 environment themes with later variations. Courses have wider roads and rounded corners; difficulty increases across the atlas. Each has a narrower lime-edged shortcut, ramps, power-up boxes, boost lines, obstacles, and guardrails with junction openings. Personal bests are stored separately per circuit in this browser.

Every standard circuit has two flight sections. Course previews and the minimap mark amber takeoffs and mint landings. The final slot is **Skyway Stunt Park**, a bonus course with six ramp-and-gap jumps and 36 obstacles, replacing Horizon Crown. Its records are stored separately from the previous final circuit.

## Files and verification

- `dist/index.html`: complete game, including styling, rendering, controls, and physics
- `verify.cjs`: automated gameplay and handling regression checks
- `.openai/hosting.json`: retained Sites identity

Run `node verify.cjs` to check all 51 circuits, shortcut lap completion, guardrails, reverse, enlarged jump gaps, neutral air stability, air steering, stored power-ups, turbo acceleration, drift charges, countersteering, solo mode, resets, and consistency at 30/60/144 Hz.

The driving, vertical motion, collision, camera, and HUD functions are separate. Handling constants are in `TUNING`. Physics uses a fixed 120 Hz step; the HUD updates once per rendered frame. Wall collisions constrain position without overriding steering. There are no competitor racers.

Drift motion uses independent body and velocity headings. Throttle maintains momentum, reduced rear grip produces actual sideways motion, and countersteering brings the body back into line. Releasing Space restores grip progressively. Drift no longer uses a hop or an artificial body-angle offset.


