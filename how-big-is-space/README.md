# How Big Is Space? — 3D Scale Journey

An interactive 3D visualization of cosmic scale, from a single human all the way to the edge of the observable universe.

## Features

- **8 scale stops** — Human → Earth → Earth–Moon System → Sun → Jupiter → Solar System → Milky Way → Observable Universe  
- **Procedural textures** — All celestial bodies rendered with canvas-generated detail (continents, craters, solar bands, spiral arms, cosmic web)  
- **Edge-glow shaders** — Custom GLSL rim-lighting shader on every object  
- **Animated star field** — Colour-varied point-cloud stars that drift slowly  
- **Smooth transitions** — Fade overlay + per-stop camera position  
- **Logarithmic scale bar** — Thumb tracks your position across 27 orders of magnitude  
- **Keyboard & scroll navigation** — Arrow keys, scroll wheel, click dots  

## Usage

Open `index.html` directly in any modern browser (no build step needed — Three.js loaded via importmap CDN).

```bash
# Quick local server (Python)
cd how-big-is-space
python3 -m http.server 8080
# then open http://localhost:8080
```

## Controls

| Action | Result |
|--------|--------|
| Scroll wheel | Next / previous scale |
| ← → Arrow keys | Navigate stops |
| Click dots | Jump to stop |
| Prev / Next buttons | Step through |

## Tech Stack

- **Three.js 0.158.0** (via CDN importmap)
- Vanilla JS ES modules — no bundler required
- GLSL custom shader for glow effect
- Canvas 2D API for all procedural textures
