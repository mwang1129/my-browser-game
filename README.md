# APEX / Solo Turbo Trials

**[Play the game](https://mwang1129.github.io/my-browser-game/)**

A browser kart-racing game with **50 circuits and the Skyway Stunt Park bonus map**. Race solo against the clock, drift for turbo, collect power-ups, and deploy wings over jump gaps. No installation or account is required to play.

## Controls

| Input | Action |
| --- | --- |
| W / Up | Accelerate; brake while reversing |
| S / Down | Brake, then hold to reverse |
| A / D or Left / Right | Steer; bank and turn while gliding |
| Space + forward + turn | Start and hold a drift |
| Release Space | Use the charged drift turbo |
| E | Use one stored turbo power-up |
| Tap Space just before landing | Attempt a trick turbo |
| R | Restart with a fresh countdown |
| Escape or Pause / Resume | Pause or resume |
| Sound Off / On | Toggle music and sound effects |

Touch controls appear on narrow screens. Steering is available immediately after the start boost.

## Current gameplay

### Countdown and start boost

The race starts with **3, 2, 1, GO**, with countdown beeps and a rising GO chime when sound is enabled. **Press and hold W / Up as 2 appears, then keep holding through GO** to earn a start turbo. The timing window is the first 0.3 seconds of the displayed 2. Pressing too early or late, braking, or releasing forward before GO cancels the bonus.

### Drifting and power-ups

Hold forward, Space, and a steering direction to drift. Keep holding Space to build charge: **0.6 seconds** for mini turbo, **1.25 seconds** for super turbo, or **2.2 seconds** for ultra turbo. Release Space to boost. Countersteer to catch a slide. Contact, takeoff, or releasing forward cancels the charge.

Glowing cyan-and-lime boxes grant one stored turbo each, with room for **three**. Press **E** to spend one for an immediate speed increase and **three seconds** of stronger acceleration. Holding E uses one item; release and press again to use another. No coin collection is required.

### Ramps, gliding, and landing

Amber ramps and chevrons mark takeoff. Mint edges mark landing platforms across gaps of at least **160 metres**. Wings deploy automatically; steer to bank and turn. Takeoff keeps your heading, and there is no automatic steering toward the landing. You can glide without holding the accelerator.

Tyre contact includes wheel centres and contact-patch corners for slightly more forgiving edge landings. Collision checks cover road surfaces, undersides, platform faces, and gap floors. A missed gap returns you to its approach with a **two-second penalty**.

For a **trick**, tap Space within **0.35 seconds before touchdown**. A successful trick displays **PERFECT LANDING / TURBO** and grants a short boost.

The camera has a wider field of view. Wings and the camera ease back after touchdown. Directional shadows use the kart and deployed-wing silhouettes, stay sharper near contact, and separate and soften with height. They project onto slopes and gap floors and clip to surface edges. A darker contact shadow helps show when the kart is on the road. Centre messages use smaller text to leave more of the track visible.

### Finishing and records

Complete the course and cross the visible finish line **forward between its posts**. Gliding across the finish counts. Ordered checkpoints preserve lap completion when flight makes the nearest-road progress jump. The clock stops at the line crossing, and the results show lap time, airtime, contacts, drift boosts, and tricks.

Personal bests are saved separately for each circuit **in the browser you are using**. Replay starts a new countdown; Next Circuit advances to the next course.

## Maps

- **50 standard circuits:** two flying sections each, with shortcuts, power-up boxes, hazards, and guardrails.
- **Skyway Stunt Park:** the final bonus map, with **six jumps and 36 obstacles**, replacing Horizon Crown.
- **106 flying sections total**, with amber takeoff and mint landing markers in course previews and on the minimap.

Open **Explore 51 Circuits** to choose a map. Courses use 17 route families and varied environments; difficulty increases across the atlas.

## Music and sound

Sound starts **off**. Click **Sound On** to hear the home-screen theme, distinct background music for every map, countdown cues, a soft acceleration rumble, and quiet gliding wind and wing flutter. Music and effects stop while paused or muted.

## Run locally

Open `dist/index.html` in a modern browser. Keep the `dist/music/` folder and `dist/sound-check.wav` beside the HTML file for music and the sound test. The game has no third-party runtime dependencies and can run offline.

## Project files and checks

- `dist/index.html` — game, rendering, controls, physics, music, and effects.
- `verify.cjs` — automated gameplay regression checks.
- `.github/workflows/pages.yml` — publishes `dist/` to GitHub Pages when changes reach `main`.

With Node.js installed, run:

```sh
node verify.cjs
```

Checks cover all maps and shortcuts, 106 jumps, landings, steering and drift, power-ups, timed starts, finish-line crossings, shadows, music and pause/mute behavior, and consistency at 30/60/144 Hz. Physics runs at a fixed 120 Hz.

Personal best lap times are saved separately for each circuit in this browser. Refreshing restores your last selected circuit and shows its best time on the home screen. Use the same browser and website address to keep your records; clearing browser data removes them. If browser storage is unavailable, the game displays a saving warning.

Tracks now sit in muted, themed landscapes with layered distant scenery and ravines or channels beneath flight gaps. Each map has its own scenery seed and lighting variant. Shortcuts use unmarked terrain-colored paths, without lime signposts or minimap highlights. Sound settings persist in this browser; tap or press a driving key to activate audio after refreshing. Resuming or interacting wakes suspended browser audio, and delayed frames skip missed music notes rather than replaying them in a burst.

The landscape uses a connected ground mesh, rolling hills, and recessed flight channels. Nature and park circuits include solid on-course trees that slow and deflect the kart on contact. Enabling sound plays a confirmation chime; music is easier to hear, and the soft engine sits in a frequency range that small speakers can reproduce.

Music also plays through regular looping audio files (52 distinct themes), with synthesized music available if a file fails to load. The Test Sound button plays an independent chime file. Regenerate music assets with `node scripts/build-music.cjs`. Ground heights blend smoothly across nearby road samples and no longer use scattered patch coloring.
