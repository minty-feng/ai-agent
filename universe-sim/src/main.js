import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const AU = 100;           // 1 AU in scene units
const YEAR = 60;          // seconds per simulated year at 1x speed
const DAY  = YEAR / 365.25;

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer  = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled  = true;
renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
container.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60000);
camera.position.set(0, 280, 520);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping    = true;
controls.dampingFactor    = 0.06;
controls.minDistance      = 3;
controls.maxDistance      = 5000;
controls.zoomSpeed        = 1.2;
controls.rotateSpeed      = 0.5;
controls.screenSpacePanning = false;

// ─── Lighting ─────────────────────────────────────────────────────────────────
const sunLight = new THREE.PointLight(0xfff5e0, 3.5, 0, 1.6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x090918, 1));

// ─── Textures (procedural) ────────────────────────────────────────────────────
function makeCanvas(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return new THREE.CanvasTexture(c);
}

function noiseVal(x, y, scale = 1, octaves = 4) {
  let v = 0, amp = 1, freq = scale, max = 0;
  for (let i = 0; i < octaves; i++) {
    v   += Math.sin(x * freq + 7.3) * Math.cos(y * freq + 2.1) * amp;
    v   += Math.cos(x * freq * 1.3 - 3.1) * Math.sin(y * freq * 0.7 + 5.5) * amp * 0.5;
    max += amp * 1.5;
    amp  *= 0.55; freq *= 2.1;
  }
  return v / max;
}

// Sun texture
const sunTex = makeCanvas(512, (ctx, S) => {
  const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  g.addColorStop(0,   '#fff8c0');
  g.addColorStop(0.3, '#ffcc40');
  g.addColorStop(0.7, '#ff8800');
  g.addColorStop(1,   '#cc4400');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // sunspot noise
  for (let i = 0; i < 120; i++) {
    const x = Math.random()*S, y = Math.random()*S;
    const r = 3 + Math.random()*18;
    const sg = ctx.createRadialGradient(x,y,0,x,y,r);
    sg.addColorStop(0,   'rgba(80,20,0,0.5)');
    sg.addColorStop(1,   'rgba(80,20,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
});

// Earth texture
const earthTex = makeCanvas(512, (ctx, S) => {
  const imgData = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = x/S * 8, ny = y/S * 8;
      const n  = (noiseVal(nx, ny, 1.0, 6) + 1) * 0.5;
      const idx = (y*S + x)*4;
      if (n > 0.52) {
        // land
        const g = 80 + n*120 | 0;
        imgData.data[idx]   = 40 + g*0.3 | 0;
        imgData.data[idx+1] = g;
        imgData.data[idx+2] = 20;
      } else {
        // ocean
        const d = n / 0.52;
        imgData.data[idx]   = 0;
        imgData.data[idx+1] = 40 + d*60 | 0;
        imgData.data[idx+2] = 120 + d*80 | 0;
      }
      imgData.data[idx+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  // polar ice caps
  const topG = ctx.createLinearGradient(0,0,0,S*0.12);
  topG.addColorStop(0,'rgba(255,255,255,0.95)'); topG.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = topG; ctx.fillRect(0,0,S,S*0.12);
  const botG = ctx.createLinearGradient(0,S*0.88,0,S);
  botG.addColorStop(0,'rgba(255,255,255,0)'); botG.addColorStop(1,'rgba(255,255,255,0.9)');
  ctx.fillStyle = botG; ctx.fillRect(0,S*0.88,S,S*0.12);
});

// Cloud texture
const cloudTex = makeCanvas(512, (ctx, S) => {
  const imgData = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n = (noiseVal(x/S*6, y/S*6, 2, 5) + 1) * 0.5;
      const a = n > 0.58 ? Math.min(255, (n - 0.58) * 600) | 0 : 0;
      const idx = (y*S + x)*4;
      imgData.data[idx] = imgData.data[idx+1] = imgData.data[idx+2] = 255;
      imgData.data[idx+3] = a;
    }
  }
  ctx.putImageData(imgData, 0, 0);
});

// Jupiter banded texture
const jupiterTex = makeCanvas(512, (ctx, S) => {
  const bands = [
    [0,    '#c8a060'],[0.06,'#e8c080'],[0.12,'#b06030'],[0.18,'#d89050'],
    [0.25,'#c07840'],[0.32,'#e0b060'],[0.4,'#b85830'],[0.48,'#d09050'],
    [0.56,'#c06828'],[0.64,'#e8c070'],[0.72,'#b07040'],[0.8,'#d0a060'],
    [0.88,'#b86030'],[0.94,'#e0b850'],[1,'#c8a060']
  ];
  const g = ctx.createLinearGradient(0, 0, 0, S);
  bands.forEach(([stop, col]) => g.addColorStop(stop, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // storm spots
  for (let i = 0; i < 8; i++) {
    const x = Math.random()*S, y = Math.random()*S;
    const rx = 20 + Math.random()*40, ry = 6 + Math.random()*12;
    const sg = ctx.createRadialGradient(x,y,0,x,y,rx);
    sg.addColorStop(0, 'rgba(180,60,0,0.6)'); sg.addColorStop(1, 'rgba(180,60,0,0)');
    ctx.fillStyle = sg;
    ctx.save(); ctx.scale(1, ry/rx); ctx.beginPath(); ctx.arc(x,y*rx/ry,rx,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
});

// Saturn ring texture
const ringTex = makeCanvas(512, (ctx, S) => {
  const imgData = ctx.createImageData(S, 1);
  for (let x = 0; x < S; x++) {
    const t = x / S;
    let a = 0;
    if (t > 0.15 && t < 0.35)      a = 0.6 + Math.random()*0.3;
    else if (t > 0.4 && t < 0.72)  a = 0.8 + Math.random()*0.2;
    else if (t > 0.78 && t < 0.92) a = 0.4 + Math.random()*0.3;
    const col = [200 + t*40 | 0, 170 + t*30 | 0, 120 + t*20 | 0];
    imgData.data[x*4]   = col[0];
    imgData.data[x*4+1] = col[1];
    imgData.data[x*4+2] = col[2];
    imgData.data[x*4+3] = a * 255 | 0;
  }
  for (let y = 0; y < S; y++) ctx.putImageData(imgData, 0, y);
});

// Generic rocky/icy texture factory
function makeRockyTex(r, g, b, roughness = 0.12) {
  return makeCanvas(256, (ctx, S) => {
    const imgData = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = (noiseVal(x/S*8, y/S*8, 1.5, 5) + 1) * 0.5;
        const v = 1 - roughness + n * roughness * 2;
        const idx = (y*S + x)*4;
        imgData.data[idx]   = Math.min(255, r * v) | 0;
        imgData.data[idx+1] = Math.min(255, g * v) | 0;
        imgData.data[idx+2] = Math.min(255, b * v) | 0;
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

// ─── Star Field ───────────────────────────────────────────────────────────────
function buildStarfield() {
  const positions = [], colors = [];
  const starColors = [
    [1.0, 0.95, 0.9],  // warm white
    [0.85, 0.9, 1.0],  // cool white
    [0.7, 0.8, 1.0],   // blue
    [0.95, 0.8, 1.0],  // purple
    [1.0, 1.0, 0.7],   // yellow
    [1.0, 0.7, 0.5],   // orange
  ];

  function addStar(theta, phi, r, bright) {
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
    const col = starColors[Math.floor(Math.random() * starColors.length)];
    const b = bright * (0.5 + Math.random() * 0.5);
    colors.push(col[0]*b, col[1]*b, col[2]*b);
  }

  // Isotropic background stars
  for (let i = 0; i < 8000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 4000 + Math.random() * 2000;
    addStar(theta, phi, r, 0.7 + Math.random() * 0.3);
  }

  // Milky Way galactic band – extra density in a flat disc
  for (let i = 0; i < 5000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const spread = (Math.random() - 0.5) * 0.35; // thin band around equator
    const phi   = Math.PI / 2 + spread;
    const r     = 4500 + Math.random() * 1500;
    addStar(theta, phi, r, 0.3 + Math.random() * 0.5);
  }

  // Nebula colour blobs (large faint colour patches)
  const nebColors = [[0.2,0.1,0.6],[0.1,0.2,0.5],[0.3,0.05,0.3],[0.0,0.15,0.5]];
  for (let i = 0; i < 1500; i++) {
    const theta  = Math.random() * Math.PI * 2;
    const spread = (Math.random() - 0.5) * 0.8;
    const phi    = Math.PI / 2 + spread;
    const r      = 4800 + Math.random() * 800;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
    const nc = nebColors[Math.floor(Math.random() * nebColors.length)];
    const b = 0.2 + Math.random() * 0.3;
    colors.push(nc[0]*b, nc[1]*b, nc[2]*b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));

  const mat = new THREE.PointsMaterial({
    size: 1.8, vertexColors: true,
    sizeAttenuation: false,
    transparent: true, opacity: 0.9,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

scene.add(buildStarfield());

// ─── Sun Glow Sprite ──────────────────────────────────────────────────────────
const sunGlowTex = makeCanvas(256, (ctx, S) => {
  const g = ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,   'rgba(255,240,100,0.8)');
  g.addColorStop(0.2, 'rgba(255,160,0,0.5)');
  g.addColorStop(0.5, 'rgba(255,80,0,0.15)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,S,S);
});

const sunGlowMat = new THREE.SpriteMaterial({ map: sunGlowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const sunGlowSprite = new THREE.Sprite(sunGlowMat);
sunGlowSprite.scale.set(120, 120, 1);
scene.add(sunGlowSprite);

// ─── Planet Data ──────────────────────────────────────────────────────────────
/*
  distance : semi-major axis in scene units (AU scale)
  radius   : visual radius (not to scale but proportional)
  period   : orbital period in Earth years
  tilt     : axial tilt in degrees
  rotSpeed : rotation speed multiplier
  ecc      : orbital eccentricity
*/
const PLANET_DATA = [
  {
    name: 'Mercury', color: '#a09888', dotColor: '#b0a898',
    radius: 1.4, distance: 0.387 * AU, period: 0.2408, tilt: 0.03, ecc: 0.206, rotSpeed: 0.017,
    texture: makeRockyTex(160, 150, 140, 0.2),
    info: 'Closest to the Sun · No atmosphere · -180°C to 430°C',
  },
  {
    name: 'Venus', color: '#e8d080', dotColor: '#eed090',
    radius: 2.2, distance: 0.723 * AU, period: 0.6152, tilt: 177.4, ecc: 0.007, rotSpeed: -0.004,
    texture: makeRockyTex(220, 190, 90, 0.15),
    info: 'Hottest planet · Retrograde rotation · Dense CO₂ atmosphere',
  },
  {
    name: 'Earth', color: '#4080c0', dotColor: '#60a0e0',
    radius: 2.4, distance: 1.0 * AU, period: 1.0, tilt: 23.44, ecc: 0.017, rotSpeed: 1.0,
    texture: earthTex, cloudTex,
    info: 'Our home · Only known life-bearing world · 1 Moon',
    hasMoon: true,
  },
  {
    name: 'Mars', color: '#c04820', dotColor: '#d05828',
    radius: 1.8, distance: 1.524 * AU, period: 1.8808, tilt: 25.19, ecc: 0.093, rotSpeed: 0.97,
    texture: makeRockyTex(200, 80, 40, 0.2),
    info: 'The Red Planet · Olympus Mons · Possible ancient water',
  },
  {
    name: 'Jupiter', color: '#c8a060', dotColor: '#d8b070',
    radius: 9.5, distance: 5.203 * AU, period: 11.862, tilt: 3.13, ecc: 0.049, rotSpeed: 2.4,
    texture: jupiterTex,
    info: 'Largest planet · Great Red Spot · 95 known moons',
  },
  {
    name: 'Saturn', color: '#e0c880', dotColor: '#f0d898',
    radius: 8.0, distance: 9.537 * AU, period: 29.457, tilt: 26.73, ecc: 0.057, rotSpeed: 2.2,
    texture: makeRockyTex(220, 200, 130, 0.1),
    hasRings: true,
    info: 'Ringed giant · Least dense planet · 146 known moons',
  },
  {
    name: 'Uranus', color: '#80d0d8', dotColor: '#90e0e8',
    radius: 4.5, distance: 19.19 * AU, period: 84.011, tilt: 97.77, ecc: 0.046, rotSpeed: -1.4,
    texture: makeRockyTex(100, 190, 210, 0.05),
    hasRings: true, ringThin: true,
    info: 'Ice giant · Extreme axial tilt · Rotates on its side',
  },
  {
    name: 'Neptune', color: '#2040c0', dotColor: '#3060e0',
    radius: 4.2, distance: 30.07 * AU, period: 164.8, tilt: 28.32, ecc: 0.010, rotSpeed: 1.5,
    texture: makeRockyTex(30, 60, 200, 0.08),
    info: 'Windiest planet · 2,100 km/h winds · Triton moon',
  },
];

// ─── Build Solar System ───────────────────────────────────────────────────────
const planets    = [];   // {data, pivot, mesh, angle, labelEl}
const orbitLines = [];

function buildOrbitLine(a, ecc, color = 0x223355) {
  const b = a * Math.sqrt(1 - ecc * ecc);
  const pts = [];
  const N = 256;
  for (let i = 0; i <= N; i++) {
    const theta = (i / N) * Math.PI * 2;
    pts.push(new THREE.Vector3(
      a * Math.cos(theta) - a * ecc,   // offset for ellipse focus
      0,
      b * Math.sin(theta)
    ));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false });
  return new THREE.Line(geo, mat);
}

// Sun
const sunGeo = new THREE.SphereGeometry(12, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);
scene.add(sunGlowSprite);

// Moon data
const MOON_DATA = {
  name: 'Moon', radius: 0.65, distance: 2.5, period: 27.3 / 365.25,
  texture: makeRockyTex(180, 175, 170, 0.22), ecc: 0.055,
};

PLANET_DATA.forEach(data => {
  // Orbit line
  const orbitLine = buildOrbitLine(data.distance, data.ecc);
  scene.add(orbitLine);
  orbitLines.push(orbitLine);

  // Pivot (orbit center offset by focus)
  const pivot = new THREE.Object3D();
  pivot.position.x = -data.distance * data.ecc; // place focus at origin
  scene.add(pivot);

  // Planet mesh
  const geo = new THREE.SphereGeometry(data.radius, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    map: data.texture,
    roughness: 0.8,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow    = true;
  mesh.receiveShadow = true;
  mesh.rotation.z    = THREE.MathUtils.degToRad(data.tilt || 0);

  // Position at semi-major axis start
  const startX = data.distance;
  mesh.position.set(startX, 0, 0);
  pivot.add(mesh);

  // Cloud layer for Earth
  let cloudMesh = null;
  if (data.cloudTex) {
    const cGeo = new THREE.SphereGeometry(data.radius * 1.015, 48, 48);
    const cMat = new THREE.MeshStandardMaterial({
      map: data.cloudTex, transparent: true, opacity: 0.55,
      depthWrite: false, roughness: 1, metalness: 0,
    });
    cloudMesh = new THREE.Mesh(cGeo, cMat);
    cloudMesh.rotation.z = mesh.rotation.z;
    mesh.add(cloudMesh);
  }

  // Atmosphere glow for Earth
  if (data.name === 'Earth') {
    const atmGeo = new THREE.SphereGeometry(data.radius * 1.08, 48, 48);
    const atmMat = new THREE.MeshStandardMaterial({
      color: 0x4080ff, transparent: true, opacity: 0.08,
      side: THREE.FrontSide, depthWrite: false,
    });
    mesh.add(new THREE.Mesh(atmGeo, atmMat));
  }

  // Saturn/Uranus rings
  let ringMesh = null;
  if (data.hasRings) {
    const inner = data.radius * (data.ringThin ? 1.3 : 1.3);
    const outer = data.radius * (data.ringThin ? 1.6 : 2.5);
    const rGeo  = new THREE.RingGeometry(inner, outer, 128);
    // Remap UVs for ring texture (radial gradient)
    const pos = rGeo.attributes.position;
    const uv  = rGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const t = (v.length() - inner) / (outer - inner);
      uv.setXY(i, t, 0.5);
    }
    const rMat = new THREE.MeshBasicMaterial({
      map: data.ringThin ? null : ringTex,
      color: data.ringThin ? 0x90c0d0 : 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: data.ringThin ? 0.35 : 0.85,
      depthWrite: false,
    });
    ringMesh = new THREE.Mesh(rGeo, rMat);
    ringMesh.rotation.x = Math.PI / 2;
    if (data.ringThin) ringMesh.rotation.y = 0.3;
    mesh.add(ringMesh);
  }

  // Moon
  let moonObj = null;
  if (data.hasMoon) {
    const mPivot = new THREE.Object3D();
    mesh.add(mPivot);
    const mGeo  = new THREE.SphereGeometry(MOON_DATA.radius, 32, 32);
    const mMat  = new THREE.MeshStandardMaterial({ map: MOON_DATA.texture, roughness: 0.9 });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.position.set(MOON_DATA.distance, 0, 0);
    mPivot.add(mMesh);
    // Moon orbit line (local)
    const mOrbitLine = buildOrbitLine(MOON_DATA.distance, MOON_DATA.ecc, 0x334466);
    mOrbitLine.rotation.x = 0;
    mesh.add(mOrbitLine);
    moonObj = { pivot: mPivot, mesh: mMesh, angle: 0 };
  }

  // Label
  const labelEl = document.createElement('div');
  labelEl.className   = 'planet-label';
  labelEl.textContent = data.name;
  document.body.appendChild(labelEl);

  const startAngle = Math.random() * Math.PI * 2;
  planets.push({
    data, pivot, mesh, cloudMesh, moonObj, ringMesh,
    angle: startAngle, labelEl,
  });
});

// ─── UI References ────────────────────────────────────────────────────────────
const speedSlider  = document.getElementById('speed-slider');
const speedVal     = document.getElementById('speed-val');
const labelsToggle = document.getElementById('labels-toggle');
const orbitsToggle = document.getElementById('orbits-toggle');
const pauseBtn     = document.getElementById('pause-btn');
const resetBtn     = document.getElementById('reset-btn');
const simDateEl    = document.getElementById('sim-date');
const planetListEl = document.getElementById('planet-list');
const focusHint    = document.getElementById('focus-hint');
const tooltip      = document.getElementById('tooltip');

// ─── Simulation State ─────────────────────────────────────────────────────────
let simSpeed    = 10;
let paused      = false;
let totalYears  = 2024;
let showLabels  = true;
let showOrbits  = true;
let focusTarget = null;   // planet object or null
let focusActive = false;

// Speed slider
speedSlider.addEventListener('input', () => {
  simSpeed = parseFloat(speedSlider.value);
  speedVal.textContent = simSpeed === 0 ? '0×' : `${simSpeed}×`;
});

// Labels toggle
labelsToggle.addEventListener('change', () => {
  showLabels = labelsToggle.checked;
  planets.forEach(p => {
    p.labelEl.classList.toggle('visible', showLabels);
  });
});

// Orbits toggle
orbitsToggle.addEventListener('change', () => {
  showOrbits = orbitsToggle.checked;
  orbitLines.forEach(l => { l.visible = showOrbits; });
});

// Pause / Play
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Play' : '⏸ Pause';
});

// Reset camera
resetBtn.addEventListener('click', () => {
  focusTarget = null; focusActive = false;
  updateActivePlanet(null);
  focusHint.classList.remove('visible');
  controls.enabled = true;
  animateCameraTo(new THREE.Vector3(0, 280, 520), new THREE.Vector3(0, 0, 0));
});

// Escape key
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && focusActive) {
    focusTarget = null; focusActive = false;
    updateActivePlanet(null);
    focusHint.classList.remove('visible');
    controls.enabled = true;
  }
});

// ─── Planet List ──────────────────────────────────────────────────────────────
PLANET_DATA.forEach((data, i) => {
  const li   = document.createElement('li');
  li.dataset.idx = i;
  const dot  = document.createElement('span');
  dot.className = 'planet-dot';
  dot.style.background = data.dotColor;
  dot.style.color      = data.dotColor;
  li.appendChild(dot);
  li.appendChild(document.createTextNode(data.name));
  li.addEventListener('click', () => focusPlanet(planets[i]));
  planetListEl.appendChild(li);
});

function updateActivePlanet(planet) {
  document.querySelectorAll('#planet-list li').forEach((li, i) => {
    li.classList.toggle('active', planet && parseInt(li.dataset.idx) === planets.indexOf(planet));
  });
}

// ─── Focus Camera ─────────────────────────────────────────────────────────────
function focusPlanet(planet) {
  focusTarget = planet;
  focusActive = true;
  updateActivePlanet(planet);
  focusHint.textContent = `Following ${planet.data.name} — Press Esc to release`;
  focusHint.classList.add('visible');
}

function animateCameraTo(targetPos, lookAt, duration = 1200) {
  const startPos   = camera.position.clone();
  const startTarget = controls.target.clone();
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPos, targetPos, ease);
    controls.target.lerpVectors(startTarget, lookAt, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── Double-click to focus ────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

renderer.domElement.addEventListener('dblclick', e => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = planets.map(p => p.mesh);
  const hits   = raycaster.intersectObjects(meshes, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj.parent && !meshes.includes(obj)) obj = obj.parent;
    const idx = meshes.indexOf(obj);
    if (idx >= 0) focusPlanet(planets[idx]);
  }
});

// ─── Tooltip on hover ─────────────────────────────────────────────────────────
renderer.domElement.addEventListener('mousemove', e => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = planets.map(p => p.mesh);
  const hits   = raycaster.intersectObjects(meshes, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj.parent && !meshes.includes(obj)) obj = obj.parent;
    const idx = meshes.indexOf(obj);
    if (idx >= 0) {
      const d = planets[idx].data;
      tooltip.innerHTML = `<strong>${d.name}</strong>${d.info}`;
      tooltip.style.left = (e.clientX + 16) + 'px';
      tooltip.style.top  = (e.clientY - 10) + 'px';
      tooltip.classList.add('visible');
      renderer.domElement.style.cursor = 'pointer';
      return;
    }
  }
  tooltip.classList.remove('visible');
  renderer.domElement.style.cursor = '';
});

// ─── Label Projection ─────────────────────────────────────────────────────────
const _vec3 = new THREE.Vector3();

function updateLabels() {
  planets.forEach(p => {
    if (!showLabels) { p.labelEl.classList.remove('visible'); return; }
    _vec3.setFromMatrixPosition(p.mesh.matrixWorld);
    _vec3.project(camera);
    const x = (_vec3.x *  0.5 + 0.5) * window.innerWidth;
    const y = (_vec3.y * -0.5 + 0.5) * window.innerHeight;
    if (_vec3.z < 1) {
      p.labelEl.style.left = x + 'px';
      p.labelEl.style.top  = y + 'px';
      p.labelEl.classList.add('visible');
    } else {
      p.labelEl.classList.remove('visible');
    }
  });
}

// ─── Animation Loop ───────────────────────────────────────────────────────────
let lastTime = performance.now();
const _camOffset = new THREE.Vector3();

function animate(now) {
  requestAnimationFrame(animate);

  const rawDt = Math.min((now - lastTime) / 1000, 0.05); // seconds, capped
  lastTime = now;
  const dt = paused ? 0 : rawDt * simSpeed;

  // Advance time
  totalYears += dt / YEAR;

  // Sun rotation
  sunMesh.rotation.y += rawDt * 0.02 * (paused ? 0 : simSpeed * 0.05);

  // Planet orbits + rotations
  planets.forEach(p => {
    const { data, pivot, mesh, cloudMesh, moonObj } = p;
    const angularSpeed = (2 * Math.PI) / (data.period * YEAR);

    if (!paused) {
      p.angle += angularSpeed * rawDt * simSpeed;
    }

    // Elliptical position: r = a(1-e²)/(1+e·cosθ)
    const a    = data.distance;
    const ecc  = data.ecc;
    const b    = a * Math.sqrt(1 - ecc * ecc);
    const px   = a * Math.cos(p.angle) - a * ecc;
    const pz   = b * Math.sin(p.angle);
    mesh.position.set(px, 0, pz);

    // Axial rotation
    mesh.rotation.y += data.rotSpeed * rawDt * (paused ? 0 : simSpeed) * 0.3;
    if (cloudMesh) cloudMesh.rotation.y += 0.0003 * rawDt * (paused ? 0 : simSpeed);

    // Moon
    if (moonObj) {
      const mSpeed = (2 * Math.PI) / (MOON_DATA.period * YEAR);
      if (!paused) moonObj.angle += mSpeed * rawDt * simSpeed;
      const ma = MOON_DATA.distance;
      const mb = ma * Math.sqrt(1 - MOON_DATA.ecc * MOON_DATA.ecc);
      moonObj.mesh.position.set(
        ma * Math.cos(moonObj.angle) - ma * MOON_DATA.ecc,
        0,
        mb * Math.sin(moonObj.angle)
      );
    }
  });

  // Camera follow
  if (focusActive && focusTarget) {
    const worldPos = new THREE.Vector3();
    focusTarget.mesh.getWorldPosition(worldPos);
    const r  = focusTarget.data.radius;
    const offset = r * 8;
    controls.target.lerp(worldPos, 0.08);
    // Keep a comfortable distance
    const dist = camera.position.distanceTo(worldPos);
    if (dist > offset * 3 || dist < offset * 0.8) {
      _camOffset.copy(camera.position).sub(controls.target).normalize().multiplyScalar(offset * 1.8);
      camera.position.lerp(controls.target.clone().add(_camOffset), 0.04);
    }
  }

  controls.update();
  updateLabels();

  // Update sim date display
  const yr = Math.floor(totalYears);
  const dayOfYear = Math.floor((totalYears - yr) * 365.25);
  simDateEl.textContent = `📅 Year ${yr}  ·  Day ${dayOfYear}`;

  // Sun glow pulse
  const pulse = 1 + Math.sin(now * 0.001) * 0.04;
  sunGlowSprite.scale.set(120 * pulse, 120 * pulse, 1);

  renderer.render(scene, camera);
}

// ─── Resize Handler ───────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Kick-off ─────────────────────────────────────────────────────────────────
// Initialize orbit visibility
orbitLines.forEach(l => { l.visible = showOrbits; });
// Initialize labels
planets.forEach(p => { if (showLabels) p.labelEl.classList.add('visible'); });

// Fade out loading screen
window.addEventListener('load', () => {
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) { loading.classList.add('fade-out'); setTimeout(() => loading.remove(), 900); }
  }, 600);
});

requestAnimationFrame(animate);
