import { useEffect, useRef } from 'react';
import { geo, isGeoLoaded } from '@/core/systems/geoWorld';
import { WORLD_HALF_X, WORLD_HALF_Z } from '@/domain/geo/meta';
import { player, useGame } from '@/state/store';
import { registry } from '@/core/systems/registry';
import { LANDMARKS } from '@/domain/landmarks';
import { VENUES } from '@/domain/venues';
import { PORTALS } from '@/domain/portals';
import { buildTransitStops, type TransitStop } from '@/domain/transit/stops';
import type { Pt } from '@/domain/geo/snapshot';

// Base map scale (pixels per world metre) used both for the offscreen base
// render and for the 1:1 crop shown in the small minimap.
const S = 0.22;
const VIEW = 210; // small minimap edge (px) — shows ~950 m across
const BIG_W = 780;
const BIG_H = 620;

function baseX(x: number): number {
  return (x + WORLD_HALF_X) * S;
}
function baseZ(z: number): number {
  return (z + WORLD_HALF_Z) * S;
}

function fillPoly(ctx: CanvasRenderingContext2D, poly: readonly Pt[]): void {
  if (poly.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(baseX(poly[0]![0]), baseZ(poly[0]![1]));
  for (let i = 1; i < poly.length; i++) ctx.lineTo(baseX(poly[i]![0]), baseZ(poly[i]![1]));
  ctx.closePath();
  ctx.fill();
}

function strokePath(ctx: CanvasRenderingContext2D, p: readonly Pt[]): void {
  if (p.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(baseX(p[0]![0]), baseZ(p[0]![1]));
  for (let i = 1; i < p.length; i++) ctx.lineTo(baseX(p[i]![0]), baseZ(p[i]![1]));
  ctx.stroke();
}

// Render the whole city once to an offscreen canvas: water, parks, squares,
// road network and coloured tram lines. North is up (−Z), East is right (+X).
function buildBase(): HTMLCanvasElement {
  const w = geo();
  const snap = w.snapshot;
  const cw = Math.ceil(WORLD_HALF_X * 2 * S);
  const ch = Math.ceil(WORLD_HALF_Z * 2 * S);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0e141b';
  ctx.fillRect(0, 0, cw, ch);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = '#1b3a55';
  for (const poly of snap.water) fillPoly(ctx, poly);
  ctx.fillStyle = '#1e3a24';
  for (const a of snap.parks) fillPoly(ctx, a.p);
  ctx.fillStyle = '#3a331f';
  for (const a of snap.squares) fillPoly(ctx, a.p);

  for (const r of snap.roads) {
    const major =
      r.k === 'motorway' ||
      r.k === 'trunk' ||
      r.k === 'primary' ||
      r.k === 'secondary' ||
      r.k === 'tertiary';
    ctx.lineWidth = major ? 1.7 : 0.7;
    ctx.strokeStyle = major ? '#5d656e' : '#3b414a';
    strokePath(ctx, r.p);
  }

  ctx.lineWidth = 1.6;
  for (const rt of w.tramRoutes) {
    ctx.strokeStyle = rt.color;
    strokePath(ctx, rt.path);
  }
  return c;
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function diamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
}

// Prominent player marker: a pulsing glow halo plus a bold triangle pointing
// where the camera looks. Camera facing in world space is (sin yaw, cos yaw);
// on the north-up canvas that screen vector has angle atan2(cos yaw, sin yaw).
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  yaw: number,
  scale = 1,
): void {
  const pulse = 1 + 0.18 * Math.sin(performance.now() / 220);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 13 * scale * pulse, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56,208,255,0.16)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 10 * scale * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(56,208,255,0.95)';
  ctx.lineWidth = 2.4 * scale;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(Math.cos(yaw), Math.sin(yaw)));
  ctx.beginPath();
  ctx.moveTo(11 * scale, 0);
  ctx.lineTo(-7 * scale, -7 * scale);
  ctx.lineTo(-3 * scale, 0);
  ctx.lineTo(-7 * scale, 7 * scale);
  ctx.closePath();
  ctx.fillStyle = '#38d0ff';
  ctx.strokeStyle = '#0a1016';
  ctx.lineWidth = 1.6 * scale;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// A hållplats marker: a small white square with a dark border.
function stopSquare(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#eef4f9';
  ctx.strokeStyle = '#0e6f9e';
  ctx.lineWidth = 1.4;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.strokeRect(x - r, y - r, r * 2, r * 2);
}

// A fast-travel portal marker: a glowing ring in the portal colour.
function portalRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  r: number,
): void {
  const pulse = 1 + 0.12 * Math.sin(performance.now() / 260);
  ctx.beginPath();
  ctx.arc(x, y, r * 1.7 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

interface BigTransform {
  ox: number;
  oy: number;
  s2: number;
}

export function Minimap(): React.JSX.Element {
  const smallRef = useRef<HTMLCanvasElement>(null);
  const bigRef = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const stops = useRef<TransitStop[] | null>(null);
  const tf = useRef<BigTransform>({ ox: 0, oy: 0, s2: 1 });
  const mapOpen = useGame((s) => s.mapOpen);

  useEffect(() => {
    let id = 0;
    const loop = (): void => {
      id = requestAnimationFrame(loop);
      if (!base.current) {
        if (isGeoLoaded()) {
          base.current = buildBase();
          stops.current = buildTransitStops(geo());
        } else return;
      }
      drawSmall();
      if (useGame.getState().mapOpen) drawBig();
    };

    const drawSmall = (): void => {
      const cv = smallRef.current;
      const b = base.current;
      if (!cv || !b) return;
      const ctx = cv.getContext('2d')!;
      const px = baseX(player.x);
      const py = baseZ(player.z);
      ctx.fillStyle = '#0b0f14';
      ctx.fillRect(0, 0, VIEW, VIEW);
      ctx.drawImage(b, px - VIEW / 2, py - VIEW / 2, VIEW, VIEW, 0, 0, VIEW, VIEW);

      const mx = (x: number): number => (x - player.x) * S + VIEW / 2;
      const my = (z: number): number => (z - player.z) * S + VIEW / 2;
      const near = (x: number, y: number): boolean => x > -6 && x < VIEW + 6 && y > -6 && y < VIEW + 6;

      for (const s of stops.current ?? []) {
        const x = mx(s.x);
        const y = my(s.z);
        if (near(x, y)) stopSquare(ctx, x, y, 2.4);
      }
      for (const l of LANDMARKS) {
        const x = mx(l.x);
        const y = my(l.z);
        if (near(x, y)) diamond(ctx, x, y, '#ffd479', 3.2);
      }
      for (const v of VENUES) {
        const x = mx(v.x);
        const y = my(v.z);
        if (near(x, y)) dot(ctx, x, y, '#ff6fae', 1.8);
      }
      for (const t of registry.trams) {
        const x = mx(t.pos.x);
        const y = my(t.pos.z);
        if (near(x, y)) dot(ctx, x, y, t.line.color, 2.6);
      }
      drawPlayer(ctx, VIEW / 2, VIEW / 2, player.camYaw, 1);

      ctx.fillStyle = 'rgba(230,237,243,0.85)';
      ctx.font = 'bold 11px Segoe UI, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('N', VIEW / 2, 4);
    };

    const drawBig = (): void => {
      const cv = bigRef.current;
      const b = base.current;
      if (!cv || !b) return;
      const ctx = cv.getContext('2d')!;
      ctx.fillStyle = '#0b0f14';
      ctx.fillRect(0, 0, BIG_W, BIG_H);
      const s2 = Math.min(BIG_W / b.width, BIG_H / b.height);
      const dw = b.width * s2;
      const dh = b.height * s2;
      const ox = (BIG_W - dw) / 2;
      const oy = (BIG_H - dh) / 2;
      tf.current = { ox, oy, s2 };
      ctx.drawImage(b, 0, 0, b.width, b.height, ox, oy, dw, dh);

      const bx = (x: number): number => ox + baseX(x) * s2;
      const bz = (z: number): number => oy + baseZ(z) * s2;

      for (const s of stops.current ?? []) stopSquare(ctx, bx(s.x), bz(s.z), 2.2);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '11px Segoe UI, system-ui';
      for (const l of LANDMARKS) {
        const x = bx(l.x);
        const y = bz(l.z);
        diamond(ctx, x, y, '#ffd479', 4);
        ctx.fillStyle = '#ffe9b0';
        ctx.fillText(l.name, x, y - 5);
      }
      for (const t of registry.trams) dot(ctx, bx(t.pos.x), bz(t.pos.z), t.line.color, 4);

      // Fast-travel portals — clickable destinations.
      ctx.font = 'bold 12px Segoe UI, system-ui';
      for (const p of PORTALS) {
        const x = bx(p.x);
        const y = bz(p.z);
        portalRing(ctx, x, y, p.color, 7);
        ctx.fillStyle = '#0b0f14';
        ctx.fillText(p.name, x + 1, y - 9);
        ctx.fillStyle = '#f4f9fd';
        ctx.fillText(p.name, x, y - 10);
      }

      drawPlayer(ctx, bx(player.x), bz(player.z), player.camYaw, 1.25);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  // Click a portal on the big map to travel there.
  const onBigClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const cv = bigRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * BIG_W;
    const cy = ((e.clientY - rect.top) / rect.height) * BIG_H;
    const { ox, oy, s2 } = tf.current;
    let best: (typeof PORTALS)[number] | null = null;
    let bestD = 18; // px hit radius
    for (const p of PORTALS) {
      const px = ox + baseX(p.x) * s2;
      const py = oy + baseZ(p.z) * s2;
      const d = Math.hypot(px - cx, py - cy);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) {
      useGame.getState().teleport(best.x, best.z, best.name);
      useGame.getState().closeMap();
    }
  };

  return (
    <>
      <div className="minimap">
        <canvas ref={smallRef} width={VIEW} height={VIEW} />
      </div>
      <div className="bigmap" style={{ display: mapOpen ? 'flex' : 'none' }}>
        <div className="bigmap-card">
          <div className="bigmap-head">
            <span>🗺️ Göteborg — karta</span>
            <span className="bigmap-hint">
              🌀 Klicka på en portal för att resa · <kbd>M</kbd> stäng
            </span>
          </div>
          <canvas ref={bigRef} width={BIG_W} height={BIG_H} onClick={onBigClick} />
        </div>
      </div>
    </>
  );
}
