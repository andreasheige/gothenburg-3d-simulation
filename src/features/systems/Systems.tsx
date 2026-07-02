import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, player } from '@/state/store';
import { useKeyPress } from '@/shared/hooks/useKeyPress';
import { tx, tz, TILE, DAY_LENGTH } from '@/core/config/world';
import { DISTRICTS } from '@/domain/districts';
import { VENUES, SHOPS } from '@/domain/venues';
import { LANDMARKS } from '@/domain/landmarks';
import { registry } from '@/core/systems/registry';
import type { InteractionKind, Landmark, Shop, TramRuntime, Venue } from '@/core/types';

interface Candidate {
  kind: InteractionKind;
  ref: unknown;
  x: number;
  z: number;
  reach: number;
  label: string;
}

// Precompute static interaction candidates (world positions).
const STATIC: Candidate[] = [
  ...VENUES.map((v): Candidate => ({ kind: 'venue', ref: v, x: tx(v.cx), z: tz(v.cy), reach: 3.6, label: `Gå in på ${v.name}` })),
  ...SHOPS.map((s): Candidate => ({
    kind: 'shop',
    ref: s,
    x: tx(s.cx),
    z: tz(s.cy),
    reach: 3.2,
    label: s.buysLoot ? `Sälj loot — ${s.name}` : `Handla — ${s.name}`,
  })),
  ...LANDMARKS.map((l): Candidate => ({ kind: 'landmark', ref: l, x: tx(l.cx), z: tz(l.cy), reach: 6, label: `Ta ett foto — ${l.name}` })),
];

interface Best {
  kind: InteractionKind;
  ref: unknown;
  label: string;
}

function districtName(x: number, z: number): string {
  const cx = Math.floor(x / TILE);
  const cy = Math.floor(z / TILE);
  for (const d of DISTRICTS) {
    const [x0, y0, x1, y1] = d.rect;
    if (cx >= x0 && cx < x1 && cy >= y0 && cy < y1) return d.name;
  }
  return 'Göteborg';
}

export function Systems(): null {
  const last = useRef({ key: '' });

  useKeyPress('e', () => {
    const s = useGame.getState();
    // riding a tram: E disembarks at a stop
    if (player.onTram) {
      const rt = player.onTram;
      if (rt.doorsOpen) {
        const st = rt.stationName || 'hållplats';
        player.x = rt.pos.x;
        player.z = rt.pos.z + 3;
        s.exitTram(st);
      } else {
        s.toast('Spårvagnen är i rörelse — vänta på nästa hållplats.', 'warn');
      }
      return;
    }
    const n = s.nearby;
    if (!n) return;
    switch (n.kind) {
      case 'venue':
        s.enterInterior((n.ref as Venue).id);
        break;
      case 'shop':
        s.buyFromShop(n.ref as Shop);
        break;
      case 'landmark':
        s.visitLandmark(n.ref as Landmark);
        break;
      case 'tourist':
        s.pickpocket();
        break;
      case 'tram':
        s.boardTram(n.ref as TramRuntime);
        break;
      default:
        break;
    }
  });

  useKeyPress('f', () => {
    const s = useGame.getState();
    if (s.hasItem('korv') || s.hasItem('kanelbulle')) {
      s.removeItem(s.hasItem('korv') ? 'korv' : 'kanelbulle');
      s.toast('Du släppte mat — måsarna anfaller! 🐦', 'warn');
      s.addScore(1);
    } else {
      s.toast('Du har ingen mat att släppa. Köp en korv först.', 'warn');
    }
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = useGame.getState();
    s.advanceTime(dt, DAY_LENGTH);
    s.decayWanted(dt);
    s.setDistrict(districtName(player.x, player.z));

    // proximity: nearest interactable
    let best: Best | null = null;
    let bestD = Infinity;
    if (!player.onTram) {
      for (const c of STATIC) {
        const d = Math.hypot(player.x - c.x, player.z - c.z);
        if (d < c.reach && d < bestD) {
          best = { kind: c.kind, ref: c.ref, label: c.label };
          bestD = d;
        }
      }
      for (const t of registry.tourists) {
        const d = Math.hypot(player.x - t.x, player.z - t.z);
        if (d < 2.4 && d < bestD) {
          best = { kind: 'tourist', ref: t, label: 'Ficktjuv (brott!)' };
          bestD = d;
        }
      }
      for (const rt of registry.trams) {
        if (!rt.doorsOpen) continue;
        const d = Math.hypot(player.x - rt.pos.x, player.z - rt.pos.z);
        if (d < 4.5 && d < bestD) {
          best = { kind: 'tram', ref: rt, label: `Åk ${rt.line.name} (${rt.stationName})` };
          bestD = d;
        }
      }
    }
    const key = player.onTram ? 'ride' : best ? best.kind + best.label : '';
    if (key !== last.current.key) {
      last.current.key = key;
      s.setNearby(best ? { kind: best.kind, label: best.label, ref: best.ref } : null);
    }
  });

  return null;
}
