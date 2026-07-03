import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/state/store';
import { useKeyPress } from '@/shared/hooks/useKeyPress';
import { Character } from '@/shared/three/Character';
import { BillboardLabel } from '@/shared/three/BillboardLabel';
import { useWalker } from './useWalker';

const camDesired = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const rideP = new THREE.Vector3();
const rideLook = new THREE.Vector3();
const tmpTan = new THREE.Vector3();

// Park bounds (metres).
const PARK = { W: 92, D: 72 } as const;
const EXIT_Z = PARK.D / 2 - 2;

type AttractionKind = 'coaster' | 'ferris' | 'carousel' | 'freefall';

interface Attraction {
  readonly id: string;
  readonly name: string;
  readonly kind: AttractionKind;
  readonly x: number;
  readonly z: number;
  readonly cost: number;
  readonly thrill: number;
  readonly duration: number;
  readonly color: string;
  /** Local control points (x,y,z) for coaster tracks, offset by (x,0,z). */
  readonly pts?: readonly (readonly [number, number, number])[];
  /** Radius for ferris (vertical) / carousel (horizontal). */
  readonly radius?: number;
  /** Tower height for free-fall. */
  readonly height?: number;
}

const ATTRACTIONS: readonly Attraction[] = [
  {
    id: 'balder',
    name: 'Balder',
    kind: 'coaster',
    x: -24,
    z: -6,
    cost: 45,
    thrill: 30,
    duration: 12,
    color: '#c98a4a',
    pts: [
      [0, 1, 0], [11, 2, -2], [17, 10, -6], [12, 17, -11], [2, 16, -15],
      [-9, 8, -13], [-16, 3, -6], [-14, 2, 3], [-5, 1, 7], [7, 1, 4],
    ],
  },
  {
    id: 'helix',
    name: 'Helix',
    kind: 'coaster',
    x: 22,
    z: -10,
    cost: 55,
    thrill: 34,
    duration: 13,
    color: '#e0602f',
    pts: [
      [0, 1, 0], [8, 4, 1], [13, 9, -3], [11, 15, -9], [3, 18, -13],
      [-6, 14, -14], [-12, 8, -10], [-13, 4, -2], [-8, 9, 5], [-1, 13, 7],
      [6, 8, 6], [9, 3, 3],
    ],
  },
  { id: 'hjulet', name: 'Lisebergshjulet', kind: 'ferris', x: 0, z: -22, cost: 30, thrill: 14, duration: 16, color: '#4f8fd0', radius: 13 },
  { id: 'atmos', name: 'AtmosFear', kind: 'freefall', x: 31, z: 8, cost: 40, thrill: 26, duration: 10, color: '#d0407f', height: 24 },
  { id: 'karusell', name: 'Karusellen', kind: 'carousel', x: -16, z: 15, cost: 20, thrill: 8, duration: 10, color: '#e0c24f', radius: 5 },
];

/** Build a closed, world-space CatmullRom curve for a coaster. */
function coasterCurve(a: Attraction): THREE.CatmullRomCurve3 {
  const v = (a.pts ?? []).map(([x, y, z]) => new THREE.Vector3(a.x + x, y, a.z + z));
  return new THREE.CatmullRomCurve3(v, true, 'catmullrom', 0.5);
}

/** Camera pose along a ride, `t` in [0,1] over the ride duration. */
function samplePose(a: Attraction, curve: THREE.CatmullRomCurve3 | null, t: number, out: THREE.Vector3, look: THREE.Vector3): void {
  if (a.kind === 'freefall') {
    const h = a.height ?? 20;
    let y: number;
    if (t < 0.55) y = 1.5 + (h - 1.5) * (t / 0.55); // slow climb
    else if (t < 0.68) y = h; // suspense hold
    else {
      const k = (t - 0.68) / 0.32;
      y = h - (h - 2) * (k * k); // accelerating drop
    }
    out.set(a.x, y + 1.2, a.z);
    look.set(a.x + 3, y - 5, a.z + 8);
    return;
  }
  if (a.kind === 'ferris') {
    const r = a.radius ?? 12;
    const ang = -Math.PI / 2 + t * Math.PI * 2;
    out.set(a.x + Math.cos(ang) * r, r + 1.5 + Math.sin(ang) * r, a.z);
    look.set(a.x + Math.cos(ang + 0.3) * r * 0.4, r + 1.5 + Math.sin(ang + 0.3) * r * 0.4, a.z + 10);
    return;
  }
  if (a.kind === 'carousel') {
    const r = (a.radius ?? 5) + 1.2;
    const ang = t * Math.PI * 4; // two revolutions
    out.set(a.x + Math.cos(ang) * r, 2.6, a.z + Math.sin(ang) * r);
    look.set(a.x + Math.cos(ang + 1.2) * (r + 6), 2.2, a.z + Math.sin(ang + 1.2) * (r + 6));
    return;
  }
  // coaster
  if (curve) {
    const tt = ((t % 1) + 1) % 1;
    curve.getPointAt(tt, out);
    curve.getTangentAt(tt, tmpTan);
    out.y += 0.8;
    look.copy(out).addScaledVector(tmpTan, 6);
  }
}

/** A wooden/steel coaster: track tube, support columns and a moving train. */
function Coaster({ a, curve }: { a: Attraction; curve: THREE.CatmullRomCurve3 }): React.JSX.Element {
  const train = useRef<THREE.Group>(null);
  const cols = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < 28; i++) out.push(curve.getPointAt(i / 28));
    return out;
  }, [curve]);
  useFrame((state) => {
    const g = train.current;
    if (!g) return;
    const t = (state.clock.elapsedTime * 0.06) % 1;
    curve.getPointAt(t, g.position);
    curve.getTangentAt(t, tmpTan);
    g.position.y += 0.55;
    g.lookAt(g.position.x + tmpTan.x, g.position.y + tmpTan.y, g.position.z + tmpTan.z);
  });
  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[curve, 160, 0.22, 6, true]} />
        <meshStandardMaterial color={a.color} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* support columns down to the ground */}
      {cols.map((p, i) => (
        <mesh key={i} position={[p.x, p.y / 2, p.z]}>
          <boxGeometry args={[0.18, Math.max(0.2, p.y), 0.18]} />
          <meshStandardMaterial color="#6b4a2e" roughness={0.9} />
        </mesh>
      ))}
      {/* train: three cars */}
      <group ref={train}>
        {[0, -0.9, -1.8].map((o, i) => (
          <mesh key={i} position={[0, 0, o]} castShadow>
            <boxGeometry args={[0.9, 0.6, 0.8]} />
            <meshStandardMaterial color={i === 0 ? '#d02020' : '#f0c020'} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Rotating ferris wheel with cabins. */
function Ferris({ a }: { a: Attraction }): React.JSX.Element {
  const wheel = useRef<THREE.Group>(null);
  const r = a.radius ?? 12;
  const cabins = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.z += dt * 0.12;
  });
  return (
    <group position={[a.x, r + 1.5, a.z]}>
      <mesh position={[-2.4, -(r + 1.5) / 2, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[0.5, r + 2, 0.5]} />
        <meshStandardMaterial color="#8a94a0" metalness={0.4} />
      </mesh>
      <mesh position={[2.4, -(r + 1.5) / 2, 0]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[0.5, r + 2, 0.5]} />
        <meshStandardMaterial color="#8a94a0" metalness={0.4} />
      </mesh>
      <group ref={wheel}>
        <mesh>
          <torusGeometry args={[r, 0.22, 10, 48]} />
          <meshStandardMaterial color={a.color} metalness={0.4} roughness={0.4} />
        </mesh>
        {cabins.map((ang, i) => (
          <group key={i} position={[Math.cos(ang) * r, Math.sin(ang) * r, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.2, 1.1, 1.4]} />
              <meshStandardMaterial color={['#e2762f', '#4f8fd0', '#2f8f6d', '#d0407f'][i % 4]!} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Free-fall tower with a gondola that rises and drops. */
function FreeFall({ a }: { a: Attraction }): React.JSX.Element {
  const car = useRef<THREE.Group>(null);
  const h = a.height ?? 20;
  useFrame((state) => {
    const g = car.current;
    if (!g) return;
    const t = (state.clock.elapsedTime * 0.08) % 1;
    let y: number;
    if (t < 0.55) y = 1.5 + (h - 1.5) * (t / 0.55);
    else if (t < 0.68) y = h;
    else {
      const k = (t - 0.68) / 0.32;
      y = h - (h - 1.5) * (k * k);
    }
    g.position.y = y;
  });
  return (
    <group position={[a.x, 0, a.z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[1, h, 1]} />
        <meshStandardMaterial color="#9aa7b2" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, h + 0.6, 0]}>
        <coneGeometry args={[0.9, 1.4, 8]} />
        <meshStandardMaterial color={a.color} />
      </mesh>
      <group ref={car}>
        <mesh position={[0, 0, 1.1]} castShadow>
          <boxGeometry args={[3.4, 0.9, 0.9]} />
          <meshStandardMaterial color={a.color} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Carousel with bobbing horses. */
function Carousel({ a }: { a: Attraction }): React.JSX.Element {
  const spin = useRef<THREE.Group>(null);
  const r = a.radius ?? 5;
  const horses = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);
  useFrame((state) => {
    const g = spin.current;
    if (!g) return;
    g.rotation.y += 0.01;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      if (c.name === 'horse') c.position.y = 1.4 + Math.sin(t * 3 + i) * 0.3;
    });
  });
  return (
    <group position={[a.x, 0, a.z]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[r + 1, r + 1.4, 0.4, 24]} />
        <meshStandardMaterial color="#6b5030" />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <coneGeometry args={[r + 1.2, 2.2, 12]} />
        <meshStandardMaterial color={a.color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
        <meshStandardMaterial color="#c0a040" metalness={0.5} />
      </mesh>
      <group ref={spin}>
        {horses.map((ang, i) => (
          <group key={i} name="horse" position={[Math.cos(ang) * r, 1.4, Math.sin(ang) * r]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
              <meshStandardMaterial color={['#fff', '#f0d0d0', '#d0d0f0'][i % 3]!} />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
              <meshStandardMaterial color="#c0a040" metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Tree({ x, z, s }: { x: number; z: number; s: number }): React.JSX.Element {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 2.2, 6]} />
        <meshStandardMaterial color="#5a3f2a" />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[1.6, 3.6, 8]} />
        <meshStandardMaterial color="#2f5a30" />
      </mesh>
    </group>
  );
}

/** A little food / game stall. */
function Stall({ x, z, color, sign }: { x: number; z: number; color: string; sign: string }): React.JSX.Element {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[3, 2.2, 2.4]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* striped awning */}
      <mesh position={[0, 2.5, 1.2]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[3.4, 0.1, 1.4]} />
        <meshStandardMaterial color="#efe6d2" />
      </mesh>
      <BillboardLabel position={[0, 3.1, 0]} fontSize={0.5} outlineWidth={0.05}>
        {sign}
      </BillboardLabel>
    </group>
  );
}

interface WalkZone {
  id: string;
  label: string;
  x: number;
  z: number;
  reach: number;
}

export function LisebergInterior(): React.JSX.Element {
  const { camera } = useThree();
  const walker = useWalker({ x: 0, z: EXIT_Z - 4, angle: Math.PI });
  const zone = useRef<WalkZone | null>(null);
  const lastKey = useRef('');
  const ride = useRef<{ a: Attraction; t: number } | null>(null);

  const curves = useMemo(() => {
    const map: Record<string, THREE.CatmullRomCurve3> = {};
    for (const a of ATTRACTIONS) if (a.kind === 'coaster') map[a.id] = coasterCurve(a);
    return map;
  }, []);

  const trees = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const r = (n: number): number => Math.abs(Math.sin(n * 127.1 + i * 13.7) * 43758.5) % 1;
        return { x: (r(1) - 0.5) * (PARK.W - 6), z: (r(2) - 0.5) * (PARK.D - 6), s: 0.7 + r(3) * 0.8 };
      }),
    [],
  );

  const startRide = (a: Attraction): void => {
    const ok = useGame.getState().rideAttraction(a.name, a.cost, a.thrill);
    if (ok) {
      ride.current = { a, t: 0 };
      useGame.getState().setNearby(null);
    }
  };

  useKeyPress('e', () => {
    if (ride.current) return; // no interactions mid-ride
    const s = useGame.getState();
    const z = zone.current;
    if (!z) return;
    if (z.id === 'exit') s.exitInterior();
    else if (z.id === 'gate') s.buyItem('akband', 20);
    else if (z.id === 'game') s.playGame(60);
    else if (z.id === 'food') s.buyItem('korv');
    else {
      const a = ATTRACTIONS.find((x) => x.id === z.id);
      if (a) startRide(a);
    }
  });

  useEffect(() => {
    useGame.getState().setNearby(null);
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);

    // ----- ride cinematic camera -----
    if (ride.current) {
      const r = ride.current;
      r.t += dt / r.a.duration;
      if (r.t >= 1) {
        ride.current = null;
      } else {
        samplePose(r.a, curves[r.a.id] ?? null, r.t, rideP, rideLook);
        camera.position.lerp(rideP, 1 - Math.pow(0.0001, dt));
        camera.lookAt(rideLook);
        return;
      }
    }

    // ----- walking -----
    walker.update(dt, PARK.W / 2 - 1, PARK.D / 2 - 1);
    const p = walker.pos;
    camDesired.set(p.x, 9, p.z + 12);
    camera.position.lerp(camDesired, 1 - Math.pow(0.004, dt));
    camTarget.set(p.x, 1.6, p.z - 4);
    camera.lookAt(camTarget);

    // proximity
    const hasBand = useGame.getState().hasItem('akband');
    let best: WalkZone | null = null;
    let bestD = Infinity;
    const consider = (z: WalkZone): void => {
      const d = Math.hypot(p.x - z.x, p.z - z.z);
      if (d < z.reach && d < bestD) {
        best = z;
        bestD = d;
      }
    };
    for (const a of ATTRACTIONS) {
      consider({
        id: a.id,
        x: a.x,
        z: a.z,
        reach: 7,
        label: `Åk ${a.name} ${hasBand ? '(åkband)' : `(${a.cost} kr)`}`,
      });
    }
    consider({ id: 'gate', x: -10, z: EXIT_Z - 3, reach: 4, label: 'Köp åkband (495 kr) — åk allt gratis' });
    consider({ id: 'game', x: 13, z: 16, reach: 4, label: 'Ringkastning (60 kr) — vinn en nalle' });
    consider({ id: 'food', x: 0, z: 8, reach: 4, label: 'Köp korv i kiosken' });
    consider({ id: 'exit', x: 6, z: EXIT_Z, reach: 3.2, label: 'Lämna Liseberg' });

    zone.current = best;
    const key = best ? (best as WalkZone).id : '';
    if (key !== lastKey.current) {
      lastKey.current = key;
      const b = best as WalkZone | null;
      useGame.getState().setNearby(
        b ? { kind: b.id === 'exit' ? 'exit' : b.id === 'gate' || b.id === 'game' || b.id === 'food' ? 'buy' : 'ride', label: b.label } : null,
      );
    }
  });

  return (
    <group>
      {/* dusk park sky + lighting */}
      <color attach="background" args={['#1b2740']} />
      <fog attach="fog" args={['#1b2740', 60, 160]} />
      <ambientLight intensity={0.4} color="#9fb0d0" />
      <hemisphereLight args={['#6a7fb0', '#20304a', 0.5]} />
      <directionalLight position={[20, 30, 10]} intensity={0.8} color="#ffd9a0" castShadow />

      {/* grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PARK.W, PARK.D]} />
        <meshStandardMaterial color="#2e4a2c" roughness={1} />
      </mesh>
      {/* central path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, PARK.D - 4]} />
        <meshStandardMaterial color="#8a7f6a" roughness={1} />
      </mesh>

      {/* perimeter fence */}
      {([[-1, 0], [1, 0]] as const).map(([sx], i) => (
        <mesh key={`fx${i}`} position={[(sx * PARK.W) / 2, 1.2, 0]}>
          <boxGeometry args={[0.3, 2.4, PARK.D]} />
          <meshStandardMaterial color="#26313f" />
        </mesh>
      ))}
      <mesh position={[0, 1.2, -PARK.D / 2]}>
        <boxGeometry args={[PARK.W, 2.4, 0.3]} />
        <meshStandardMaterial color="#26313f" />
      </mesh>

      {/* entrance arch */}
      <group position={[0, 0, EXIT_Z + 1]}>
        <mesh position={[-5, 3, 0]}>
          <boxGeometry args={[1, 6, 1]} />
          <meshStandardMaterial color="#b23b2e" />
        </mesh>
        <mesh position={[5, 3, 0]}>
          <boxGeometry args={[1, 6, 1]} />
          <meshStandardMaterial color="#b23b2e" />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[11, 1.4, 1]} />
          <meshStandardMaterial color="#d9c24f" emissive="#e0a020" emissiveIntensity={0.4} />
        </mesh>
        <BillboardLabel position={[0, 6.2, 0.6]} fontSize={1} color="#1b2740" outlineWidth={0.05}>
          LISEBERG
        </BillboardLabel>
      </group>

      {/* åkband ticket booth */}
      <Stall x={-10} z={EXIT_Z - 3} color="#2f6e8c" sign="Åkband 🎟️" />

      {/* string lights along the path */}
      {Array.from({ length: 9 }).map((_, i) => {
        const zz = -PARK.D / 2 + 6 + i * 7;
        return (
          <group key={`sl${i}`}>
            <mesh position={[0, 5, zz]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshStandardMaterial color="#fff" emissive="#ffe08a" emissiveIntensity={1} />
            </mesh>
            <pointLight position={[0, 5, zz]} intensity={0.5} distance={12} color="#ffe08a" />
          </group>
        );
      })}

      {/* attractions */}
      {ATTRACTIONS.map((a) => {
        if (a.kind === 'coaster') {
          const c = curves[a.id];
          return c ? <Coaster key={a.id} a={a} curve={c} /> : null;
        }
        if (a.kind === 'ferris') return <Ferris key={a.id} a={a} />;
        if (a.kind === 'freefall') return <FreeFall key={a.id} a={a} />;
        return <Carousel key={a.id} a={a} />;
      })}

      {/* ride name signs */}
      {ATTRACTIONS.map((a) => (
        <BillboardLabel key={`lbl${a.id}`} position={[a.x, 1.4, a.z + 3]} fontSize={0.7} color={a.color} outlineWidth={0.05}>
          {a.name}
        </BillboardLabel>
      ))}

      {/* game + food stalls */}
      <Stall x={13} z={16} color="#7a3f8c" sign="Ringkastning 🧸" />
      <Stall x={0} z={8} color="#b23b2e" sign="Korvkiosk 🌭" />

      {/* trees */}
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} s={t.s} />
      ))}

      <Character
        groupRef={walker.avatarRef}
        legLRef={walker.legLRef}
        legRRef={walker.legRRef}
        colors={{ coat: '#c2402f', hat: '#e0c24f' }}
      />
    </group>
  );
}
