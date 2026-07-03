import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, player } from '@/state/store';
import { useKeyPress } from '@/shared/hooks/useKeyPress';
import { realDayT } from '@/core/systems/time';
import { geo } from '@/core/systems/geoWorld';
import { nearestStreet, nearestLandmark } from '@/core/systems/navigation';
import { currentService } from '@/domain/transit/schedule';
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

// Precompute static interaction candidates (world positions in metres).
const STATIC: Candidate[] = [
  ...VENUES.map((v): Candidate => ({ kind: 'venue', ref: v, x: v.x, z: v.z, reach: 5, label: `Gå in på ${v.name}` })),
  ...SHOPS.map((s): Candidate => ({
    kind: 'shop',
    ref: s,
    x: s.x,
    z: s.z,
    reach: 4.5,
    label: s.buysLoot ? `Sälj loot — ${s.name}` : `Handla — ${s.name}`,
  })),
  ...LANDMARKS.map((l): Candidate => ({ kind: 'landmark', ref: l, x: l.x, z: l.z, reach: 12, label: `Ta ett foto — ${l.name}` })),
];

interface Best {
  kind: InteractionKind;
  ref: unknown;
  label: string;
}

export function Systems(): null {
  const last = useRef({ key: '' });
  const navAcc = useRef(0);

  useKeyPress('m', () => useGame.getState().toggleMap());
  useKeyPress('t', () => useGame.getState().toggleTravel());
  useKeyPress('escape', () => {
    const s = useGame.getState();
    s.closeMap();
    s.closeTravel();
  });

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
    // Clock is synced to real Gothenburg time; only push to state on a minute
    // change to avoid re-rendering the HUD every frame.
    const rt = realDayT();
    if (Math.floor(rt * 1440) !== Math.floor(s.dayT * 1440)) useGame.setState({ dayT: rt });
    s.decayWanted(dt);
    s.setDistrict(geo().nearestHood(player.x, player.z));

    // orientation readouts (nearest street + landmark), a few times per second
    navAcc.current += dt;
    if (navAcc.current > 0.35) {
      navAcc.current = 0;
      const street = nearestStreet(player.x, player.z);
      const nl = nearestLandmark(player.x, player.z);
      s.setNav(street, nl ? { name: nl.name, dist: Math.round(nl.dist) } : null);
    }

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
          const svc = currentService(rt.line.id);
          best = {
            kind: 'tram',
            ref: rt,
            label: `Åk ${rt.line.name} (${rt.stationName}) · avgång var ${svc.headwayMin} min`,
          };
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
