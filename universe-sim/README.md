# 🌌 Solar System Simulator

A production-quality, real-time 3D solar system simulation built with **Three.js r158** — no build step required, runs directly in any modern browser.

## Features

| Feature | Details |
|---|---|
| **All 8 planets** | Mercury → Neptune with scientifically accurate relative sizes & distances |
| **Orbital mechanics** | Real relative periods, elliptical orbits (Kepler), axial tilts |
| **Moon** | Earth's Moon with correct ~27.3-day period |
| **Ring systems** | Saturn (textured rings), Uranus (thin tilted rings) |
| **Starfield** | 14,500+ stars with Milky Way galactic-band density boost & nebula colours |
| **Procedural textures** | All planet surfaces generated via Canvas API (no external image assets) |
| **Atmosphere** | Earth atmospheric glow layer, cloud layer |
| **Sun glow** | Additive-blended pulsing sprite + point light casting shadows |
| **Camera** | OrbitControls — zoom, pan, free-rotate |
| **Planet focus** | Double-click any planet, or use the sidebar list, to follow it |
| **UI panel** | Speed slider (0–100×), labels toggle, orbits toggle, pause/play, camera reset |
| **Sim date** | Real-time year/day counter |

## Running

Simply open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

> **Note:** Because the app uses ES modules with an import-map, you may need to serve it via a local HTTP server rather than opening the file directly with `file://` in some browsers.

```bash
# Python (any directory)
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then navigate to `http://localhost:8080/universe-sim/`.

## Controls

| Action | Result |
|---|---|
| Left-drag | Orbit camera |
| Right-drag / two-finger | Pan |
| Scroll wheel | Zoom |
| Double-click planet | Follow that planet |
| Esc | Release focus, free camera |
| Sidebar planet list | Click to focus |
| Speed slider | 0× (frozen) → 100× fast-forward |

## Architecture

```
universe-sim/
├── index.html        # Entry point, importmap, UI markup
├── src/
│   ├── main.js       # Three.js scene, animation loop, orbital mechanics
│   └── style.css     # Dark glass UI, planet labels, responsive layout
└── README.md
```

All planet textures are procedurally generated at runtime using the Canvas 2D API — no external image files needed.
