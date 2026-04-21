import * as THREE from 'three';

/* ════════════════════════════════════════════════════════════════════════════
   Glow Shaders — rim-lighting effect on sphere edges
   ════════════════════════════════════════════════════════════════════════════ */
const GLOW_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vNormal  = normalize(normalMatrix * normal);
    vec4 mv  = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
const GLOW_FRAG = /* glsl */`
  uniform vec3  glowColor;
  uniform float glowIntensity;
  uniform float glowExp;
  varying vec3  vNormal;
  varying vec3  vViewPos;
  void main() {
    float rim   = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPos)));
    float alpha = pow(rim, glowExp) * glowIntensity;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

/* ════════════════════════════════════════════════════════════════════════════
   Procedural texture helpers
   ════════════════════════════════════════════════════════════════════════════ */
function tex(sz, fn) {
  const c = document.createElement('canvas');
  c.width = c.height = sz;
  fn(c.getContext('2d'), sz);
  return new THREE.CanvasTexture(c);
}

// Lazy texture cache — each texture is generated at most once
const CACHE = {};
function lazyTex(key, fn) { return CACHE[key] ??= fn(); }

/* ── Human ─────────────────────────────────────────────────────────────────── */
function mkHuman() {
  return tex(256, (ctx, S) => {
    const g = ctx.createRadialGradient(S * 0.38, S * 0.38, 0, S * 0.5, S * 0.5, S * 0.52);
    g.addColorStop(0, '#f6c6a2');
    g.addColorStop(0.55, '#e09060');
    g.addColorStop(1, '#a04020');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(160, 80, 40, 0.12)';
    for (let i = 0; i < 120; i++) ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  });
}

/* ── Earth ─────────────────────────────────────────────────────────────────── */
function mkEarth() {
  return tex(512, (ctx, S) => {
    ctx.fillStyle = '#1565c0'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#2d7a33';
    // Rough continent blobs
    [[0.14, 0.35, 130, 100], [0.52, 0.28, 110, 100], [0.70, 0.34, 130, 80], [0.77, 0.63, 60, 50]]
      .forEach(([cx, cy, w, h]) => {
        for (let j = 0; j < 12; j++) {
          ctx.beginPath();
          ctx.arc(
            (cx + (Math.random() - 0.5) * 0.14) * S,
            (cy + (Math.random() - 0.5) * 0.12) * S,
            12 + Math.random() * 40, 0, Math.PI * 2
          );
          ctx.fill();
        }
      });
    // Ice caps
    let ig = ctx.createLinearGradient(0, 0, 0, S * 0.2);
    ig.addColorStop(0, 'rgba(240,252,255,0.96)'); ig.addColorStop(1, 'rgba(240,252,255,0)');
    ctx.fillStyle = ig; ctx.fillRect(0, 0, S, S * 0.2);
    ig = ctx.createLinearGradient(0, S * 0.8, 0, S);
    ig.addColorStop(0, 'rgba(240,252,255,0)'); ig.addColorStop(1, 'rgba(240,252,255,0.93)');
    ctx.fillStyle = ig; ctx.fillRect(0, S * 0.8, S, S * 0.2);
    // Cloud wisps
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * S, Math.random() * S, 8 + Math.random() * 32, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* ── Moon ──────────────────────────────────────────────────────────────────── */
function mkMoon() {
  return tex(512, (ctx, S) => {
    ctx.fillStyle = '#888'; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 72; i++) {
      const x = Math.random() * S, y = Math.random() * S, r = 4 + Math.random() * 24;
      const g = ctx.createRadialGradient(x - r * 0.15, y - r * 0.15, r * 0.05, x, y, r);
      g.addColorStop(0, 'rgba(188,183,178,0.96)');
      g.addColorStop(0.7, 'rgba(112,108,104,0.6)');
      g.addColorStop(1, 'rgba(72,68,64,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const e = ctx.createRadialGradient(S * 0.5, S * 0.5, S * 0.3, S * 0.5, S * 0.5, S * 0.52);
    e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = e; ctx.fillRect(0, 0, S, S);
  });
}

/* ── Sun ───────────────────────────────────────────────────────────────────── */
function mkSun() {
  return tex(512, (ctx, S) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#fff9c0'); g.addColorStop(0.3, '#ffcc40');
    g.addColorStop(0.65, '#ff8800'); g.addColorStop(1, '#c03300');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 110; i++) {
      const x = Math.random() * S, y = Math.random() * S, r = 3 + Math.random() * 16;
      const sg = ctx.createRadialGradient(x, y, 0, x, y, r);
      sg.addColorStop(0, 'rgba(80,20,0,0.68)'); sg.addColorStop(1, 'rgba(80,20,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Plasma filaments
    ctx.strokeStyle = 'rgba(255,180,30,0.2)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 25; i++) {
      const x = S / 2 + (Math.random() - 0.5) * S * 0.6;
      const y = S / 2 + (Math.random() - 0.5) * S * 0.6;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50,
        x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30
      );
      ctx.stroke();
    }
  });
}

/* ── Jupiter ───────────────────────────────────────────────────────────────── */
function mkJupiter() {
  return tex(512, (ctx, S) => {
    const bands = ['#c8a870','#e8c090','#b08050','#d4aa70','#c87844',
                   '#ddb870','#b47840','#d4aa70','#c08050','#e8c890','#b87840','#c8a870'];
    const bh = S / bands.length;
    bands.forEach((c, i) => {
      const g = ctx.createLinearGradient(0, i * bh, 0, (i + 1) * bh);
      g.addColorStop(0, c); g.addColorStop(1, bands[(i + 1) % bands.length]);
      ctx.fillStyle = g; ctx.fillRect(0, i * bh, S, bh + 1);
    });
    // Great Red Spot
    const gx = S * 0.65, gy = S * 0.60, gw = S * 0.12, gh = S * 0.07;
    const grs = ctx.createRadialGradient(gx, gy, 0, gx, gy, gw);
    grs.addColorStop(0, '#cc4422'); grs.addColorStop(0.6, '#aa3311'); grs.addColorStop(1, 'rgba(150,50,30,0)');
    ctx.fillStyle = grs;
    ctx.beginPath(); ctx.ellipse(gx, gy, gw, gh, 0, 0, Math.PI * 2); ctx.fill();
  });
}

/* ── Solar system top-down view ────────────────────────────────────────────── */
function mkSolarSystem() {
  return tex(512, (ctx, S) => {
    ctx.fillStyle = '#000010'; ctx.fillRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2;
    const radii = [0.10, 0.16, 0.22, 0.27, 0.35, 0.41, 0.47, 0.51];
    radii.forEach(r => {
      ctx.strokeStyle = 'rgba(60,110,170,0.4)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(cx, cy, r * S, 0, Math.PI * 2); ctx.stroke();
    });
    // Sun glow
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.05);
    sg.addColorStop(0, '#fff8c0'); sg.addColorStop(0.5, '#ffcc40'); sg.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, S * 0.05, 0, Math.PI * 2); ctx.fill();
    // Planets
    const pc = ['#a87848','#e8c880','#3399ff','#ff4433','#c8a060','#e8d490','#88ccff','#6688ff'];
    const ps = [0.006, 0.008, 0.009, 0.007, 0.018, 0.016, 0.013, 0.012];
    radii.forEach((r, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.65;
      ctx.fillStyle = pc[i];
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * S, cy + Math.sin(a) * r * S, ps[i] * S, 0, Math.PI * 2); ctx.fill();
    });
  });
}

/* ── Milky Way spiral ──────────────────────────────────────────────────────── */
function mkGalaxy() {
  return tex(512, (ctx, S) => {
    ctx.fillStyle = '#000010'; ctx.fillRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2;
    // Spiral arms
    for (let arm = 0; arm < 4; arm++) {
      const base = (arm / 4) * Math.PI * 2;
      for (let i = 0; i < 900; i++) {
        const t = i / 900, a = base + t * Math.PI * 4, r = t * S * 0.44;
        const sc = (Math.random() - 0.5) * r * 0.36;
        const x = cx + (r + sc) * Math.cos(a), y = cy + (r + sc) * Math.sin(a);
        const b = ((1 - t) * 255) | 0;
        ctx.fillStyle = `rgba(${b},${(b * 0.76) | 0},${(b * 0.52) | 0},${(1 - t * 0.72) * 0.9})`;
        ctx.beginPath(); ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Dust lanes
    for (let arm = 0; arm < 2; arm++) {
      const base = (arm / 2) * Math.PI * 2 + 0.35;
      for (let i = 0; i < 180; i++) {
        const t = i / 180, a = base + t * Math.PI * 3, r = t * S * 0.36;
        ctx.fillStyle = `rgba(8,4,18,${0.3 - t * 0.28})`;
        ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Central bulge
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.14);
    bg.addColorStop(0, 'rgba(255,220,180,0.94)');
    bg.addColorStop(0.5, 'rgba(255,160,80,0.4)');
    bg.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, S * 0.14, 0, Math.PI * 2); ctx.fill();
  });
}

/* ── Observable Universe (cosmic web) ─────────────────────────────────────── */
function mkUniverse() {
  return tex(512, (ctx, S) => {
    ctx.fillStyle = '#000008'; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 280; i++) {
      const x1 = Math.random() * S, y1 = Math.random() * S;
      const r = (80 + Math.random() * 120) | 0;
      const g = (50 + Math.random() * 80) | 0;
      const b = (200 + Math.random() * 55) | 0;
      ctx.strokeStyle = `rgba(${r},${g},${b},${Math.random() * 0.2})`;
      ctx.lineWidth = Math.random() * 0.7;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (Math.random() - 0.5) * S * 0.35, y1 + (Math.random() - 0.5) * S * 0.35);
      ctx.stroke();
    }
    // Galaxy clusters
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * S, y = Math.random() * S, bv = Math.random();
      ctx.fillStyle = `rgba(${(140 + bv * 115) | 0},${(100 + bv * 90) | 0},255,${bv * 0.9})`;
      ctx.beginPath(); ctx.arc(x, y, Math.random() * 0.9, 0, Math.PI * 2); ctx.fill();
    }
    // Cosmic voids
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * S, y = Math.random() * S, r = 16 + Math.random() * 62;
      const vg = ctx.createRadialGradient(x, y, 0, x, y, r);
      vg.addColorStop(0, 'rgba(0,0,0,0.75)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   Scale stop definitions
   ════════════════════════════════════════════════════════════════════════════ */
const STOPS = [
  {
    index: 0, emoji: '🧑', name: 'A Human', subtitle: 'The Starting Point',
    realSize: '1.8 meters', logPos: 0.26,
    fact: 'Your body holds ≈37 trillion cells and 7 octillion atoms — nearly all forged inside dying stars billions of years ago.',
    comparison: 'You are here · baseline',
    mainType: 'sphere', texKey: 'human', texFn: mkHuman,
    color: 0xf0a070, emissive: 0x7c2010, emissiveIntensity: 0.20,
    roughness: 0.85, metalness: 0.0, sphereR: 1.4, isStar: false,
    glowColor: [1.0, 0.55, 0.25], glowIntensity: 0.9, glowExp: 3.5, glowR: 1.75,
    camZ: 3.8, lightColor: 0xffeedd, lightIntensity: 1.8,
    starCount: 400, bgColor: 0x010308,
  },
  {
    index: 1, emoji: '🌍', name: 'Earth', subtitle: 'Our Home Planet',
    realSize: '12,742 km diameter', logPos: 7.10,
    fact: 'Earth is 7,079,000× the height of a human. Despite feeling vast, it\'s an invisible blue dot from the outer solar system.',
    comparison: '7,079,000× a human',
    mainType: 'sphere', texKey: 'earth', texFn: mkEarth, atmosphere: true,
    color: 0x1565c0, emissive: 0x0a2040, emissiveIntensity: 0.14,
    roughness: 0.62, metalness: 0.08, sphereR: 1.5, isStar: false,
    glowColor: [0.25, 0.55, 1.0], glowIntensity: 1.1, glowExp: 2.5, glowR: 1.87,
    camZ: 3.8, lightColor: 0xfff5e0, lightIntensity: 2.2,
    starCount: 700, bgColor: 0x000210,
  },
  {
    index: 2, emoji: '🌙', name: 'Earth–Moon System', subtitle: 'Our Cosmic Backyard',
    realSize: '384,400 km Moon orbit', logPos: 8.58,
    fact: 'If Earth were a basketball, the Moon would be a tennis ball 7 metres away. Every human who has ever lived was born within this distance from Earth.',
    comparison: '30× Earth diameters apart',
    mainType: 'earth-moon', texKey: null, texFn: null,
    color: 0xaaaaaa, emissive: 0x222222, emissiveIntensity: 0.10,
    roughness: 0.9, metalness: 0.0, sphereR: 1.5, isStar: false,
    glowColor: [0.75, 0.75, 0.85], glowIntensity: 0.6, glowExp: 4.0, glowR: 1.85,
    camZ: 5.2, lightColor: 0xfff5e0, lightIntensity: 2.0,
    starCount: 900, bgColor: 0x000110,
  },
  {
    index: 3, emoji: '☀️', name: 'The Sun', subtitle: 'Our Star',
    realSize: '1,392,700 km diameter', logPos: 9.14,
    fact: '109 Earths span the Sun\'s diameter. Its core reaches 15 million °C and fuses 620 million tonnes of hydrogen every single second.',
    comparison: '109× Earth · 770 million× a human',
    mainType: 'sphere', texKey: 'sun', texFn: mkSun, isStar: true,
    color: 0xffcc40, emissive: 0xff6600, emissiveIntensity: 1.6,
    roughness: 0.42, metalness: 0.0, sphereR: 1.6,
    glowColor: [1.0, 0.72, 0.12], glowIntensity: 2.2, glowExp: 1.7, glowR: 2.1,
    camZ: 4.2, lightColor: 0xffeebb, lightIntensity: 3.5,
    starCount: 1100, bgColor: 0x000005,
  },
  {
    index: 4, emoji: '🪐', name: 'Jupiter', subtitle: 'King of the Solar System',
    realSize: '139,820 km diameter', logPos: 8.15,
    fact: 'Jupiter\'s gravity shields Earth from countless asteroid impacts. Its iconic Great Red Spot is a storm wider than Earth that has raged for centuries.',
    comparison: '11× Earth · 1,300 Earths fit inside',
    mainType: 'sphere', texKey: 'jupiter', texFn: mkJupiter,
    color: 0xc8a870, emissive: 0x503020, emissiveIntensity: 0.12,
    roughness: 0.68, metalness: 0.0, sphereR: 1.55, isStar: false,
    glowColor: [0.90, 0.72, 0.42], glowIntensity: 0.85, glowExp: 3.0, glowR: 1.92,
    camZ: 4.0, lightColor: 0xffeedd, lightIntensity: 1.9,
    starCount: 1000, bgColor: 0x000008,
  },
  {
    index: 5, emoji: '🌌', name: 'The Solar System', subtitle: 'Our Stellar Neighbourhood',
    realSize: '~18 billion km to Pluto', logPos: 12.95,
    fact: 'Light from the Sun takes 5.5 hours to reach Pluto. The New Horizons probe, launched in 2006, only flew past Pluto in 2015 — after 9 years of travel.',
    comparison: '12,900× Earth\'s orbital distance',
    mainType: 'flat-disk', texKey: 'solar-system', texFn: mkSolarSystem,
    color: 0x405880, emissive: 0x101828, emissiveIntensity: 0.35,
    roughness: 0.5, metalness: 0.25, sphereR: 1.8, isStar: false,
    glowColor: [0.40, 0.55, 0.85], glowIntensity: 0.7, glowExp: 2.2, glowR: 2.1,
    camZ: 5.5, lightColor: 0xffffff, lightIntensity: 1.2,
    starCount: 1500, bgColor: 0x000005,
  },
  {
    index: 6, emoji: '🌌', name: 'The Milky Way', subtitle: 'Our Galaxy',
    realSize: '100,000 light-years across', logPos: 20.97,
    fact: 'The Milky Way holds 200–400 billion stars. We sit 26,000 light-years from the galactic core. Light leaving the centre left before Homo sapiens existed.',
    comparison: '9.46 × 10²⁰ m — utterly unimaginable',
    mainType: 'flat-disk', texKey: 'galaxy', texFn: mkGalaxy,
    color: 0xa090c0, emissive: 0x301060, emissiveIntensity: 0.42,
    roughness: 0.32, metalness: 0.0, sphereR: 1.85, isStar: false,
    glowColor: [0.62, 0.42, 1.0], glowIntensity: 1.4, glowExp: 1.5, glowR: 2.2,
    camZ: 5.5, lightColor: 0xc0a0ff, lightIntensity: 1.6,
    starCount: 2200, bgColor: 0x000003,
  },
  {
    index: 7, emoji: '🔭', name: 'The Observable Universe', subtitle: 'Everything We Can See',
    realSize: '93 billion light-years across', logPos: 26.94,
    fact: 'Contains an estimated 2 trillion galaxies, each with ~100 billion stars. The universe\'s true size may be infinite — this is only as far as light has had time to reach us.',
    comparison: '930,000× the Milky Way',
    mainType: 'sphere', texKey: 'universe', texFn: mkUniverse,
    color: 0x6040c0, emissive: 0x200840, emissiveIntensity: 0.45,
    roughness: 0.22, metalness: 0.0, sphereR: 1.7, isStar: false,
    glowColor: [0.42, 0.22, 1.0], glowIntensity: 1.6, glowExp: 1.2, glowR: 2.1,
    camZ: 5.8, lightColor: 0x8060ff, lightIntensity: 1.3,
    starCount: 3200, bgColor: 0x000001,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   Renderer, Scene, Camera
   ════════════════════════════════════════════════════════════════════════════ */
const container = document.getElementById('canvas-container');
const renderer  = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.001, 2000);
camera.position.set(0, 0, STOPS[0].camZ);

/* ── Lights ────────────────────────────────────────────────────────────────── */
const mainLight    = new THREE.PointLight(0xffeedd, 2.0, 100, 1.8);
mainLight.position.set(5, 3, 5);
scene.add(mainLight);
const ambientLight = new THREE.AmbientLight(0x080818, 1.0);
scene.add(ambientLight);

/* ════════════════════════════════════════════════════════════════════════════
   Star field
   ════════════════════════════════════════════════════════════════════════════ */
let starMesh = null;

function buildStars(count) {
  if (starMesh) { scene.remove(starMesh); starMesh.geometry.dispose(); }
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 18 + Math.random() * 55;
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const hue = Math.random();
    const bri = 0.7 + Math.random() * 0.3;
    col[i * 3]     = bri * (hue < 0.3 ? 0.72 : 1.0);
    col[i * 3 + 1] = bri * (hue < 0.3 ? 0.72 : hue < 0.7 ? 1.0 : 0.82);
    col[i * 3 + 2] = bri * (hue < 0.3 ? 1.0  : hue < 0.7 ? 0.82 : 0.52);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  starMesh = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.09, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true,
  }));
  scene.add(starMesh);
}

/* ════════════════════════════════════════════════════════════════════════════
   Scene management — current stop meshes
   ════════════════════════════════════════════════════════════════════════════ */
let mainMesh = null;
let glowMesh = null;
const extras = [];  // extra meshes per stop

function clearScene() {
  if (rocketGroup) { scene.remove(rocketGroup); rocketGroup = null; }
  const all = [mainMesh, glowMesh, ...extras];
  all.forEach(m => { if (m) { scene.remove(m); m.geometry?.dispose(); } });
  mainMesh = null; glowMesh = null; extras.length = 0;
}

function makeGlowMesh(radius, color, intensity, exp, side = THREE.BackSide) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        glowColor:     { value: new THREE.Vector3(...color) },
        glowIntensity: { value: intensity },
        glowExp:       { value: exp },
      },
      vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG,
      transparent: true, side, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Rocket mesh builder
   ════════════════════════════════════════════════════════════════════════════ */
function buildRocketMesh() {
  const g   = new THREE.Group();
  const wht = new THREE.MeshStandardMaterial({ color: 0xddeeff, metalness: 0.70, roughness: 0.25 });
  const red = new THREE.MeshStandardMaterial({ color: 0xff2020, metalness: 0.40, roughness: 0.50 });

  // Body
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.054, 0.26, 12), wht));

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.14, 12), red);
  nose.position.y = 0.20;
  g.add(nose);

  // 3 fins
  for (let i = 0; i < 3; i++) {
    const a  = (i / 3) * Math.PI * 2;
    const fn = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.09, 0.009), wht);
    fn.position.set(Math.cos(a) * 0.058, -0.11, Math.sin(a) * 0.058);
    fn.rotation.y = -a;
    g.add(fn);
  }

  // Exhaust flame (inverted cone, pointing down)
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff7700, emissive: 0xff5500, emissiveIntensity: 2.5,
    transparent: true, opacity: 0.88,
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.12, 8), flameMat);
  flame.rotation.z = Math.PI;
  flame.position.y = -0.19;
  g.add(flame);
  g.userData.flameMat = flameMat;

  const fLight = new THREE.PointLight(0xff6600, 1.4, 0.85);
  fLight.position.y = -0.20;
  g.add(fLight);
  g.userData.fLight = fLight;

  return g;
}

/* ════════════════════════════════════════════════════════════════════════════
   Warp speed lines  (built once into the scene, persist across stops)
   ════════════════════════════════════════════════════════════════════════════ */
function initWarp() {
  const N = 200, pos = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const s = Math.sin(phi), c = Math.cos(phi);
    const r = 2.0 + Math.random() * 5, l = 0.6 + Math.random() * 2.0;
    pos[i * 6]     = r * s * Math.cos(theta);
    pos[i * 6 + 1] = r * s * Math.sin(theta);
    pos[i * 6 + 2] = r * c;
    pos[i * 6 + 3] = (r + l) * s * Math.cos(theta);
    pos[i * 6 + 4] = (r + l) * s * Math.sin(theta);
    pos[i * 6 + 5] = (r + l) * c;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  warpLines = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: 0x9bbbff, transparent: true, opacity: 0, depthWrite: false })
  );
  scene.add(warpLines);
}

/* ─── Camera fly-in easing ──────────────────────────────────────────────── */
const FLY_IN_DISTANCE_MULT = 5.5;  // camera starts this many times farther than target Z
const FLY_IN_DURATION      = 0.60; // seconds for the easeOutCubic zoom

// Warp transition timing constants (milliseconds)
const WARP_DIM_MS       = 120; // start screen dim
const WARP_BLACKOUT_MS  = 330; // reach full black
const SCENE_SWAP_MS     = 480; // swap scene + begin fly-in
const WARP_FADEOUT_MS   = 220; // ms after swap to start fading warp lines
const TRANSITION_END_MS = 800; // ms after swap to unlock navigation
const WARP_FADE_SPEED   = 14;  // lerp rate for warp line opacity per second

function easeOutCubic(t) { return 1 - (1 - t) ** 3; }

function startFlyIn(toZ) {
  flyFromZ = toZ * FLY_IN_DISTANCE_MULT;
  flyToZ   = toZ;
  flyT     = 0;
  camera.position.z = flyFromZ;
}

function buildStop(idx) {
  clearScene();
  const s = STOPS[idx];

  buildStars(s.starCount);
  scene.background = new THREE.Color(s.bgColor);
  mainLight.color.set(s.lightColor);
  mainLight.intensity = s.lightIntensity;

  /* ── Earth–Moon special layout ─────────────────────────────────────────── */
  if (s.mainType === 'earth-moon') {
    const earthMat = new THREE.MeshStandardMaterial({
      map: lazyTex('earth', mkEarth), roughness: 0.62, metalness: 0.08,
      emissive: 0x0a2040, emissiveIntensity: 0.1,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), earthMat);
    earth.position.set(-1.7, 0, 0);
    scene.add(earth); extras.push(earth);

    // Earth atmosphere
    const atm = makeGlowMesh(1.26, [0.3, 0.6, 1.0], 1.15, 2.5, THREE.FrontSide);
    atm.position.copy(earth.position);
    scene.add(atm); extras.push(atm);

    const moonMat = new THREE.MeshStandardMaterial({
      map: lazyTex('moon', mkMoon), roughness: 0.92,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.30, 32, 32), moonMat);
    moon.position.set(1.8, 0, 0);
    scene.add(moon); extras.push(moon);

    // Placeholder invisible mainMesh (keeps logic consistent)
    mainMesh = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial());
    mainMesh.visible = false;
    scene.add(mainMesh);
    return;
  }

  /* ── Generic sphere / flat-disk ──────────────────────────────────────── */
  const geo = s.mainType === 'flat-disk'
    ? new THREE.CylinderGeometry(s.sphereR, s.sphereR * 0.88, 0.07, 64)
    : new THREE.SphereGeometry(s.sphereR, 64, 64);

  const mat = new THREE.MeshStandardMaterial({
    map: s.texFn ? lazyTex(s.texKey, s.texFn) : null,
    color: s.color,
    emissive: s.emissive,
    emissiveIntensity: s.emissiveIntensity,
    roughness: s.roughness,
    metalness: s.metalness,
  });

  mainMesh = new THREE.Mesh(geo, mat);
  if (s.mainType === 'flat-disk') mainMesh.rotation.x = Math.PI * 0.14;
  scene.add(mainMesh);

  // Glow halo
  glowMesh = makeGlowMesh(s.glowR, s.glowColor, s.glowIntensity, s.glowExp);
  scene.add(glowMesh);

  // Atmosphere (Earth)
  if (s.atmosphere) {
    const atm = makeGlowMesh(s.sphereR * 1.12, [0.3, 0.6, 1.0], 1.2, 3.0, THREE.FrontSide);
    scene.add(atm); extras.push(atm);
  }

  // Star self-illumination (Sun)
  if (s.isStar) {
    const starLight = new THREE.PointLight(0xffeeaa, 4.5, 22, 1.5);
    scene.add(starLight); extras.push(starLight);
    // Extra outer corona
    const corona = makeGlowMesh(s.sphereR * 1.6, [1.0, 0.8, 0.2], 1.0, 1.2, THREE.BackSide);
    scene.add(corona); extras.push(corona);
  }

  // Rocket — present at Human (stop 0) and Earth (stop 1) stops
  rocketLaunch = false;
  rocketVelY   = 0;
  if (idx === 0) {
    rocketGroup = buildRocketMesh();
    rocketGroup.position.set(s.sphereR + 0.30, s.sphereR * 0.55, 0.2);
    scene.add(rocketGroup);
  } else if (idx === 1) {
    rocketGroup = buildRocketMesh();
    rocketGroup.scale.setScalar(0.18);
    rocketGroup.position.set(0.4, s.sphereR + 0.022, 0.15);
    scene.add(rocketGroup);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   State & camera animation
   ════════════════════════════════════════════════════════════════════════════ */
let currentStop  = 0;
let targetCamZ   = STOPS[0].camZ;
let isTransitioning = false;

// Rocket state
let rocketGroup  = null;
let rocketLaunch = false;
let rocketVelY   = 0;

// Warp speed lines state
let warpLines  = null;
let warpAlpha  = 0;
let warpTarget = 0;

// Camera fly-in state
let flyFromZ = 0, flyToZ = 0, flyT = 1;

/* ════════════════════════════════════════════════════════════════════════════
   UI updates
   ════════════════════════════════════════════════════════════════════════════ */
const LOG_MIN = STOPS[0].logPos;
const LOG_MAX = STOPS[STOPS.length - 1].logPos;

function updateUI(idx) {
  const s = STOPS[idx];
  document.getElementById('stop-emoji').textContent      = s.emoji;
  document.getElementById('stop-name').textContent       = s.name;
  document.getElementById('stop-subtitle').textContent   = s.subtitle;
  document.getElementById('stop-size').textContent       = s.realSize;
  document.getElementById('stop-comparison').textContent = s.comparison;
  document.getElementById('stop-fact').textContent       = s.fact;
  document.getElementById('stop-index').textContent      = `${idx + 1} / ${STOPS.length}`;

  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  document.getElementById('btn-prev').disabled = idx === 0;
  document.getElementById('btn-next').disabled = idx === STOPS.length - 1;

  const pct = ((s.logPos - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
  document.getElementById('scale-thumb').style.left = `${pct}%`;
}

/* ════════════════════════════════════════════════════════════════════════════
   Navigation
   ════════════════════════════════════════════════════════════════════════════ */
const overlay = document.getElementById('fade-overlay');

function navigateTo(idx) {
  if (isTransitioning) return;
  idx = Math.max(0, Math.min(STOPS.length - 1, idx));
  if (idx === currentStop) return;

  isTransitioning = true;

  // Trigger rocket launch animation if one is visible
  if (rocketGroup) {
    rocketLaunch = true;
    rocketVelY   = 0;
  }

  // Phase 1: Warp lines flash in
  warpTarget = 1;

  // Phase 2: Screen dims then goes full black for scene swap
  setTimeout(() => { overlay.style.opacity = '0.5'; }, WARP_DIM_MS);
  setTimeout(() => { overlay.style.opacity = '1'; }, WARP_BLACKOUT_MS);

  // Phase 3: Swap scene, start camera fly-in, fade out
  setTimeout(() => {
    currentStop = idx;
    buildStop(idx);
    updateUI(idx);

    startFlyIn(STOPS[idx].camZ);
    targetCamZ = STOPS[idx].camZ;

    overlay.style.opacity = '0';

    // Warp lines fade out shortly after scene appears
    setTimeout(() => { warpTarget = 0; }, WARP_FADEOUT_MS);

    setTimeout(() => { isTransitioning = false; }, TRANSITION_END_MS);
  }, SCENE_SWAP_MS);
}

/* ── Event listeners ───────────────────────────────────────────────────────── */
let scrollAcc = 0;
window.addEventListener('wheel', e => {
  if (isTransitioning) return;
  scrollAcc += e.deltaY;
  if (Math.abs(scrollAcc) > 80) {
    navigateTo(currentStop + (scrollAcc > 0 ? 1 : -1));
    scrollAcc = 0;
  }
}, { passive: true });

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigateTo(currentStop + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigateTo(currentStop - 1);
});

document.getElementById('btn-prev').addEventListener('click', () => navigateTo(currentStop - 1));
document.getElementById('btn-next').addEventListener('click', () => navigateTo(currentStop + 1));

document.querySelectorAll('.dot').forEach((d, i) => {
  d.addEventListener('click', () => navigateTo(i));
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ════════════════════════════════════════════════════════════════════════════
   Animation loop
   ════════════════════════════════════════════════════════════════════════════ */
const clock = new THREE.Clock();
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  time += dt;

  // ── Camera fly-in ─────────────────────────────────────────────────────────
  if (flyT < 1) {
    flyT = Math.min(1, flyT + dt / FLY_IN_DURATION);
    camera.position.z = flyFromZ + (flyToZ - flyFromZ) * easeOutCubic(flyT);
  }

  // ── Warp speed lines opacity ──────────────────────────────────────────────
  if (warpLines) {
    warpAlpha += (warpTarget - warpAlpha) * Math.min(1, dt * WARP_FADE_SPEED);
    warpLines.material.opacity = Math.max(0, warpAlpha * 0.80);
    warpLines.rotation.z += dt * 0.4;
  }

  // ── Rocket animation ──────────────────────────────────────────────────────
  if (rocketGroup) {
    // Pulsing exhaust flame
    const pulse = 0.82 + Math.sin(time * 14) * 0.18;
    if (rocketGroup.userData.flameMat) {
      rocketGroup.userData.flameMat.emissiveIntensity = 2.5 * pulse;
      rocketGroup.userData.flameMat.opacity = 0.70 + pulse * 0.18;
    }
    if (rocketGroup.userData.fLight) {
      rocketGroup.userData.fLight.intensity = 1.4 * pulse;
    }
    // Gentle hover bobbing when idle
    if (!rocketLaunch) {
      rocketGroup.position.y += Math.sin(time * 2.2) * dt * 0.02;
    }
    // Launch: rocket accelerates upward
    if (rocketLaunch) {
      rocketVelY += dt * 4.5;
      rocketGroup.position.y += rocketVelY * dt;
    }
  }

  // ── Rotate the main object ────────────────────────────────────────────────
  if (mainMesh?.visible) {
    mainMesh.rotation.y += dt * 0.10;
    if (glowMesh) glowMesh.rotation.copy(mainMesh.rotation);
  }

  // ── Earth–Moon stop: animate both bodies ──────────────────────────────────
  if (currentStop === 2 && extras.length >= 3) {
    const [earth, atm, moon] = extras;
    earth.rotation.y += dt * 0.14;
    if (atm) atm.rotation.y = earth.rotation.y;
    moon.rotation.y  += dt * 0.05;
    // Moon slow orbit around Earth's position midpoint
    const orbit = time * 0.22;
    moon.position.set(1.8 * Math.cos(orbit), 0.1 * Math.sin(orbit * 0.5), 1.8 * Math.sin(orbit));
  }

  // ── Gentle star drift ─────────────────────────────────────────────────────
  if (starMesh) starMesh.rotation.y += dt * 0.003;

  // ── Sun pulsing glow ──────────────────────────────────────────────────────
  if (currentStop === 3) {
    if (glowMesh?.material?.uniforms) {
      glowMesh.material.uniforms.glowIntensity.value = 2.0 + Math.sin(time * 1.8) * 0.5;
    }
  }

  // ── Galaxy & solar system slow tilt-drift for depth feel ─────────────────
  if ((currentStop === 5 || currentStop === 6) && mainMesh) {
    mainMesh.rotation.y += dt * 0.06;
    mainMesh.rotation.z = Math.sin(time * 0.18) * 0.04;
  }

  // ── Universe sphere slow pulse ────────────────────────────────────────────
  if (currentStop === 7) {
    if (glowMesh?.material?.uniforms) {
      glowMesh.material.uniforms.glowIntensity.value = 1.4 + Math.sin(time * 0.9) * 0.35;
    }
  }

  renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════════════════════
   Bootstrap
   ════════════════════════════════════════════════════════════════════════════ */
buildStop(0);
updateUI(0);
initWarp();
animate();
