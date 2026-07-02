// Fetch OpenStreetMap data for central Gothenburg via the Overpass API,
// project lon/lat to local metric world coordinates, and emit a compact
// committed snapshot. Run: `node scripts/fetch-osm.mjs`.
//
// Output:
//   public/geo/gothenburg.json   — heavy layers (buildings, roads, water, ...)
//   src/domain/geo/meta.ts       — bbox + projection constants (typed)
//
// The projection is a simple equirectangular map centred on the bbox, so
// 1 world unit == 1 metre. North is -Z, East is +X.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Bounding box: wide central Gothenburg (core + Linné/Slottskogen/Liseberg
//     + across the river to Lindholmen/Frihamnen). [S, W, N, E] ---
const BBOX = { s: 57.68, w: 11.915, n: 57.725, e: 12.015 };
const LAT0 = (BBOX.s + BBOX.n) / 2;
const LON0 = (BBOX.w + BBOX.e) / 2;
const R = 6371000;
const M_PER_DEG_LAT = (R * Math.PI) / 180;
const M_PER_DEG_LON = M_PER_DEG_LAT * Math.cos((LAT0 * Math.PI) / 180);

const round1 = (n) => Math.round(n * 10) / 10;
function project(lon, lat) {
  const x = (lon - LON0) * M_PER_DEG_LON;
  const z = -(lat - LAT0) * M_PER_DEG_LAT;
  return [round1(x), round1(z)];
}

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function overpass(query) {
  let lastErr;
  for (const ep of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
        });
        if (!res.ok) throw new Error(`${ep} -> HTTP ${res.status}`);
        const json = await res.json();
        return json.elements ?? [];
      } catch (e) {
        lastErr = e;
        console.warn(`  retry (${ep}): ${e.message}`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  }
  throw lastErr;
}

const bb = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;

function projGeom(geometry) {
  return geometry ? geometry.map((p) => project(p.lon, p.lat)) : [];
}

async function main() {
  console.log('bbox', bb, 'origin', LAT0, LON0);

  // 1) Roads (named + classified)
  console.log('fetching roads…');
  const roadEls = await overpass(`[out:json][timeout:180];
    way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|living_street|unclassified|pedestrian|footway|path|cycleway|service)$"](${bb});
    out geom;`);
  const roads = roadEls
    .filter((e) => e.geometry?.length > 1)
    .map((e) => ({
      n: e.tags?.name,
      k: e.tags.highway,
      p: projGeom(e.geometry),
    }));

  // 2) Tram tracks (rails) + tram route relations (named lines w/ colour)
  console.log('fetching tram tracks…');
  const tramWays = await overpass(`[out:json][timeout:120];
    way["railway"="tram"](${bb}); out geom;`);
  const tramTracks = tramWays.filter((e) => e.geometry?.length > 1).map((e) => projGeom(e.geometry));

  console.log('fetching tram routes…');
  const tramRels = await overpass(`[out:json][timeout:180];
    relation["route"="tram"](${bb}); out geom;`);
  const tramLines = tramRels.map((rel) => ({
    ref: rel.tags?.ref ?? rel.tags?.name ?? '',
    name: rel.tags?.name ?? '',
    colour: rel.tags?.colour ?? null,
    from: rel.tags?.from ?? '',
    to: rel.tags?.to ?? '',
    // member ways (each with its own geometry) — stitched later at load
    ways: (rel.members ?? [])
      .filter((m) => m.type === 'way' && m.geometry?.length > 1 && m.role === '')
      .map((m) => projGeom(m.geometry)),
  }));

  // 3) Ferry routes (Älvsnabben etc.)
  console.log('fetching ferry routes…');
  const ferryEls = await overpass(`[out:json][timeout:120];
    (way["route"="ferry"](${bb}); relation["route"="ferry"](${bb}););
    out geom;`);
  const ferries = [];
  for (const e of ferryEls) {
    if (e.type === 'way' && e.geometry?.length > 1) ferries.push({ n: e.tags?.name ?? '', p: projGeom(e.geometry) });
    if (e.type === 'relation')
      for (const m of e.members ?? [])
        if (m.geometry?.length > 1) ferries.push({ n: e.tags?.name ?? '', p: projGeom(m.geometry) });
  }

  // 4) Water (Göta älv + docks/basins)
  console.log('fetching water…');
  const waterEls = await overpass(`[out:json][timeout:180];
    (way["natural"="water"](${bb});
     way["waterway"="riverbank"](${bb});
     way["water"](${bb});
     relation["natural"="water"](${bb}););
    out geom;`);
  const water = [];
  for (const e of waterEls) {
    if (e.type === 'way' && e.geometry?.length > 2) water.push(projGeom(e.geometry));
    if (e.type === 'relation')
      for (const m of e.members ?? [])
        if (m.role === 'outer' && m.geometry?.length > 2) water.push(projGeom(m.geometry));
  }

  // 5) Parks & green areas
  console.log('fetching parks…');
  const parkEls = await overpass(`[out:json][timeout:180];
    (way["leisure"~"^(park|garden|nature_reserve|pitch)$"](${bb});
     way["landuse"~"^(grass|forest|recreation_ground|cemetery)$"](${bb}););
    out geom;`);
  const parks = parkEls
    .filter((e) => e.geometry?.length > 2)
    .map((e) => ({ n: e.tags?.name, k: e.tags?.leisure ?? e.tags?.landuse, p: projGeom(e.geometry) }));

  // 6) Squares / pedestrian plazas
  console.log('fetching squares…');
  const squareEls = await overpass(`[out:json][timeout:120];
    (way["place"="square"](${bb});
     way["highway"="pedestrian"]["area"="yes"](${bb}););
    out geom;`);
  const squares = squareEls
    .filter((e) => e.geometry?.length > 2)
    .map((e) => ({ n: e.tags?.name, p: projGeom(e.geometry) }));

  // 7) Neighbourhoods (for HUD district naming)
  console.log('fetching neighbourhoods…');
  const hoodEls = await overpass(`[out:json][timeout:120];
    node["place"~"^(suburb|neighbourhood|quarter|borough)$"](${bb}); out;`);
  const hoods = hoodEls
    .filter((e) => e.tags?.name && e.lon != null)
    .map((e) => ({ n: e.tags.name, p: project(e.lon, e.lat) }));

  // 8) Buildings (heavy)
  console.log('fetching buildings… (this is the big one)');
  const bEls = await overpass(`[out:json][timeout:240];
    way["building"](${bb}); out geom;`);
  const buildings = bEls
    .filter((e) => e.geometry?.length > 3)
    .map((e) => {
      const t = e.tags ?? {};
      let h = parseFloat(t.height);
      if (!Number.isFinite(h)) {
        const lv = parseFloat(t['building:levels']);
        h = Number.isFinite(lv) ? lv * 3.2 : 0;
      }
      return { p: projGeom(e.geometry), h: h > 0 ? round1(h) : 0 };
    });

  const snapshot = {
    meta: { bbox: BBOX, lat0: LAT0, lon0: LON0, mPerDegLat: M_PER_DEG_LAT, mPerDegLon: M_PER_DEG_LON, generated: new Date().toISOString() },
    roads,
    tramTracks,
    tramLines,
    ferries,
    water,
    parks,
    squares,
    hoods,
    buildings,
  };

  mkdirSync(resolve(ROOT, 'public/geo'), { recursive: true });
  const outPath = resolve(ROOT, 'public/geo/gothenburg.json');
  writeFileSync(outPath, JSON.stringify(snapshot));

  mkdirSync(resolve(ROOT, 'src/domain/geo'), { recursive: true });
  const metaTs = `// AUTO-GENERATED by scripts/fetch-osm.mjs — do not edit by hand.
// Equirectangular projection of central Gothenburg. 1 unit == 1 metre; North is -Z.
export const GEO_META = {
  bbox: { s: ${BBOX.s}, w: ${BBOX.w}, n: ${BBOX.n}, e: ${BBOX.e} },
  lat0: ${LAT0},
  lon0: ${LON0},
  mPerDegLat: ${M_PER_DEG_LAT},
  mPerDegLon: ${M_PER_DEG_LON},
} as const;

/** Project WGS84 lon/lat to local world metres (x east, z south). */
export function project(lon: number, lat: number): { x: number; z: number } {
  return {
    x: (lon - GEO_META.lon0) * GEO_META.mPerDegLon,
    z: -(lat - GEO_META.lat0) * GEO_META.mPerDegLat,
  };
}

/** Half-extents of the world in metres. */
export const WORLD_HALF_X = ((GEO_META.bbox.e - GEO_META.bbox.w) / 2) * GEO_META.mPerDegLon;
export const WORLD_HALF_Z = ((GEO_META.bbox.n - GEO_META.bbox.s) / 2) * GEO_META.mPerDegLat;
`;
  writeFileSync(resolve(ROOT, 'src/domain/geo/meta.ts'), metaTs);

  const sz = (a) => (Array.isArray(a) ? a.length : 0);
  console.log('--- counts ---');
  console.log('roads       ', sz(roads));
  console.log('tramTracks  ', sz(tramTracks));
  console.log('tramLines   ', sz(tramLines), '=>', tramLines.map((l) => l.ref).filter(Boolean).join(','));
  console.log('ferries     ', sz(ferries));
  console.log('water       ', sz(water));
  console.log('parks       ', sz(parks));
  console.log('squares     ', sz(squares));
  console.log('hoods       ', sz(hoods));
  console.log('buildings   ', sz(buildings));
  const bytes = Buffer.byteLength(JSON.stringify(snapshot));
  console.log('snapshot bytes', (bytes / 1e6).toFixed(2), 'MB ->', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
