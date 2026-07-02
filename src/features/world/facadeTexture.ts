import * as THREE from 'three';

// Procedural facade textures shared by every building wall. Two maps are baked
// into small tiling canvases:
//   - `map`      : light facade base with darker glass panes + frames (tinted
//                  per-building by vertex colour)
//   - `emissive` : black except for a deterministic subset of "lit" windows,
//                  so only some panes glow warm after dusk.
// A single tile holds an N×N grid of windows and repeats across each wall via
// UV coordinates scaled by wall length/height (see buildBuildingsGeometry).

export interface FacadeTextures {
  readonly map: THREE.CanvasTexture;
  readonly emissive: THREE.CanvasTexture;
}

const GRID = 8; // windows per tile edge
const CELL = 32; // px per window cell
const SIZE = GRID * CELL; // 256px tile

export function buildFacadeTextures(): FacadeTextures {
  const mapC = document.createElement('canvas');
  const emC = document.createElement('canvas');
  mapC.width = mapC.height = SIZE;
  emC.width = emC.height = SIZE;
  const m = mapC.getContext('2d')!;
  const e = emC.getContext('2d')!;

  m.fillStyle = '#d0c9bb'; // facade base (tinted by vertex colour at runtime)
  m.fillRect(0, 0, SIZE, SIZE);
  e.fillStyle = '#000000';
  e.fillRect(0, 0, SIZE, SIZE);

  // Deterministic PRNG so the lit-window pattern is stable across reloads.
  let seed = 20240607;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x = gx * CELL;
      const y = gy * CELL;
      const px = x + 5;
      const py = y + 6;
      const pw = CELL - 10;
      const ph = CELL - 11;

      // recessed frame + glass pane
      m.fillStyle = '#b3ab99';
      m.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
      m.fillStyle = '#6d7c88';
      m.fillRect(px, py, pw, ph);
      // mullions
      m.fillStyle = '#b3ab99';
      m.fillRect(px + pw / 2 - 1, py, 2, ph);
      m.fillRect(px, py + ph / 2 - 1, pw, 2);

      // emissive: some windows lit, warm/cool variation
      if (rnd() < 0.5) {
        e.fillStyle = rnd() < 0.78 ? '#ffcf85' : '#fff1cf';
        e.fillRect(px, py, pw, ph);
        e.fillStyle = 'rgba(0,0,0,0.35)';
        e.fillRect(px + pw / 2 - 1, py, 2, ph);
        e.fillRect(px, py + ph / 2 - 1, pw, 2);
      }
    }
  }

  const map = new THREE.CanvasTexture(mapC);
  const emissive = new THREE.CanvasTexture(emC);
  for (const t of [map, emissive]) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
  }
  map.colorSpace = THREE.SRGBColorSpace;
  emissive.colorSpace = THREE.SRGBColorSpace;
  return { map, emissive };
}
