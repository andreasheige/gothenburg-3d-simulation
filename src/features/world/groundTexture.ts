import * as THREE from 'three';

// Small deterministic PRNG so the generated textures are stable across reloads.
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function canvas(size: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement, repeat: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Mottled wet-asphalt paving for the base ground plane.
export function buildPavingTexture(): THREE.CanvasTexture {
  const { c, ctx } = canvas(256);
  const rng = makeRng(101);
  ctx.fillStyle = '#6a6e6b';
  ctx.fillRect(0, 0, 256, 256);
  // grain speckle
  for (let i = 0; i < 5000; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const v = 0.5 + rng() * 0.5;
    const shade = rng() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${(v * 0.06).toFixed(3)})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  // faint slab seams
  ctx.strokeStyle = 'rgba(30,32,34,0.35)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 256; g += 64) {
    ctx.beginPath();
    ctx.moveTo(g + 0.5, 0);
    ctx.lineTo(g + 0.5, 256);
    ctx.moveTo(0, g + 0.5);
    ctx.lineTo(256, g + 0.5);
    ctx.stroke();
  }
  return toTexture(c, 1);
}

// Patchy park grass with darker mown stripes.
export function buildGrassTexture(): THREE.CanvasTexture {
  const { c, ctx } = canvas(256);
  const rng = makeRng(202);
  ctx.fillStyle = '#4f7a3d';
  ctx.fillRect(0, 0, 256, 256);
  // mown stripes
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = (y / 32) % 2 === 0 ? 'rgba(60,100,45,0.35)' : 'rgba(80,120,60,0.25)';
    ctx.fillRect(0, y, 256, 32);
  }
  // blade speckle
  for (let i = 0; i < 9000; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const g = 90 + rng() * 90;
    ctx.strokeStyle = `rgba(${(g * 0.5) | 0},${g | 0},${(g * 0.45) | 0},0.4)`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 2, y - 1.5 - rng() * 2);
    ctx.stroke();
  }
  return toTexture(c, 1);
}

// Rounded cobblestones with grout, for the paved squares.
export function buildCobbleTexture(): THREE.CanvasTexture {
  const { c, ctx } = canvas(256);
  const rng = makeRng(303);
  ctx.fillStyle = '#7d7263'; // grout
  ctx.fillRect(0, 0, 256, 256);
  const cell = 32;
  for (let gy = 0; gy < 256; gy += cell) {
    const offset = (gy / cell) % 2 === 0 ? 0 : cell / 2;
    for (let gx = -cell; gx < 256; gx += cell) {
      const cx = gx + offset + cell / 2 + (rng() - 0.5) * 3;
      const cy = gy + cell / 2 + (rng() - 0.5) * 3;
      const r = cell * 0.42 + rng() * 3;
      const base = 150 + rng() * 40;
      const tint = rng();
      const cr = (base * (0.9 + tint * 0.2)) | 0;
      const cg = (base * (0.86 + tint * 0.14)) | 0;
      const cb = (base * (0.74 + tint * 0.1)) | 0;
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
      grad.addColorStop(0, `rgb(${Math.min(255, cr + 25)},${Math.min(255, cg + 25)},${Math.min(255, cb + 20)})`);
      grad.addColorStop(1, `rgb(${(cr * 0.7) | 0},${(cg * 0.7) | 0},${(cb * 0.7) | 0})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(c, 1);
}
