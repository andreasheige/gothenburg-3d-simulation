import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/state/store';
import { useKeyPress } from '@/shared/hooks/useKeyPress';
import { THEMES, ROOM, currentConcert, isConcertVenue, venueSeed } from '@/domain/interiors';
import type { ConcertDef } from '@/domain/interiors';
import { Character } from '@/shared/three/Character';
import { BillboardLabel } from '@/shared/three/BillboardLabel';
import { useWalker } from './useWalker';
import type { Venue } from '@/core/types';

const camDesired = new THREE.Vector3();
const camTarget = new THREE.Vector3();

const BAR_Z = -ROOM.D / 2 + 1.4;
const BAR_FRONT = -ROOM.D / 2 + 3.0;
const DOOR_Z = ROOM.D / 2 - 0.4;

const PATRON_COLORS = ['#c2402f', '#2b4a7a', '#6a2f6a', '#3a6a3a', '#8a6a2f', '#5a5a6a'];

interface PatronData {
  x: number;
  z: number;
  color: string;
  sway: number;
}

/** A single dancing/standing punter. `beat`/`energy` drive concert head-bounce. */
function Patron({ x, z, color, sway, beat, energy }: PatronData & { beat: number; energy: number }): React.JSX.Element {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const group = g.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    if (energy > 0) {
      // bounce to the beat, and headbang harder the more energetic the show
      group.position.y = Math.abs(Math.sin(t * beat + x)) * 0.12 * (0.4 + energy);
      group.rotation.x = Math.sin(t * beat + z) * 0.35 * energy;
      group.rotation.z = Math.sin(t * sway + x) * 0.06;
    } else {
      group.rotation.z = Math.sin(t * sway + x) * 0.08;
      group.position.y = Math.abs(Math.sin(t * sway * 0.5 + z)) * 0.06;
    }
  });
  return (
    <group ref={g} position={[x, 0, z]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.85, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial color="#e6b98f" roughness={0.8} />
      </mesh>
    </group>
  );
}

function DanceFloor({ accent }: { accent: string }): React.JSX.Element {
  const ref = useRef<THREE.Group>(null);
  const tiles = useMemo<[number, number, boolean][]>(() => {
    const arr: [number, number, boolean][] = [];
    const n = 5;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) arr.push([i - (n - 1) / 2, j - (n - 1) / 2, (i + j) % 2 === 0]);
    return arr;
  }, []);
  useFrame((state) => {
    const group = ref.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      const hue = (t * 0.2 + i * 0.06) % 1;
      mat.emissive.setHSL(hue, 0.9, 0.5);
      mat.emissiveIntensity = 0.5 + 0.5 * Math.sin(t * 3 + i);
    });
  });
  return (
    <group ref={ref} position={[0, 0.02, 2]}>
      {tiles.map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x * 1.3, 0, z * 1.3]} receiveShadow>
          <planeGeometry args={[1.28, 1.28]} />
          <meshStandardMaterial color="#111" emissive={accent} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function DiscoLights({ color }: { color: string }): React.JSX.Element {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (a.current) {
      a.current.position.x = Math.sin(t * 1.3) * 5;
      a.current.intensity = 6 + Math.sin(t * 5) * 3;
    }
    if (b.current) {
      b.current.position.x = Math.cos(t * 1.1) * 5;
      b.current.intensity = 6 + Math.cos(t * 4) * 3;
    }
  });
  return (
    <>
      <pointLight ref={a} color={color} position={[-4, 4.5, 2]} intensity={6} distance={16} />
      <pointLight ref={b} color="#4fa3ff" position={[4, 4.5, 2]} intensity={6} distance={16} />
    </>
  );
}

function Stage({ accent }: { accent: string }): React.JSX.Element {
  return (
    <group position={[0, 0, -ROOM.D / 2 + 3.2]}>
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROOM.W - 8, 0.5, 3]} />
        <meshStandardMaterial color="#15151a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.4, -1.4]}>
        <planeGeometry args={[ROOM.W - 8, 4]} />
        <meshStandardMaterial color="#0c0c10" />
      </mesh>
      <spotLight
        position={[0, 5, 3]}
        angle={0.6}
        penumbra={0.5}
        intensity={8}
        color={accent}
        distance={20}
        target-position={[0, 0.5, -ROOM.D / 2 + 3.2]}
        castShadow
      />
      <mesh position={[-4, 0.9, 0]} castShadow>
        <boxGeometry args={[1.2, 1.3, 1]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[4, 0.9, 0]} castShadow>
        <boxGeometry args={[1.2, 1.3, 1]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

/** One band member: instrument colour + headbang/bounce driven by energy. */
function BandMember({ x, instrument, color, beat, energy }: { x: number; instrument: 'guitar' | 'mic' | 'dj'; color: string; beat: number; energy: number }): React.JSX.Element {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const grp = g.current;
    if (!grp) return;
    const t = state.clock.elapsedTime;
    grp.rotation.x = Math.sin(t * beat + x) * 0.4 * energy;
    grp.position.y = 0.5 + Math.abs(Math.sin(t * beat * 0.5 + x)) * 0.1 * energy;
  });
  return (
    <group ref={g} position={[x, 0.5, 0]}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.8, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color="#e6b98f" roughness={0.8} />
      </mesh>
      {instrument === 'guitar' && (
        <mesh position={[0.3, 0.95, 0.25]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.14, 1.0, 0.06]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
        </mesh>
      )}
      {instrument === 'mic' && (
        <mesh position={[0, 1.5, 0.35]}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      )}
      {instrument === 'dj' && (
        <mesh position={[0, 0.55, 0.5]}>
          <boxGeometry args={[1.4, 0.2, 0.7]} />
          <meshStandardMaterial color="#0a0a0a" emissive="#3a3a3a" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

/** A genre-specific live concert stage: backdrop poster, band, beat-synced lights, haze. */
function ConcertStage({ concert }: { concert: ConcertDef }): React.JSX.Element {
  const l1 = useRef<THREE.SpotLight>(null);
  const l2 = useRef<THREE.SpotLight>(null);
  const stageZ = -ROOM.D / 2 + 3.2;
  const members = useMemo(() => {
    if (concert.genre === 'singer') return [{ x: 0, instrument: 'mic' as const }];
    if (concert.genre === 'hiphop')
      return [
        { x: -1.6, instrument: 'mic' as const },
        { x: 1.8, instrument: 'dj' as const },
      ];
    if (concert.genre === 'techno') return [{ x: 0, instrument: 'dj' as const }];
    // blackmetal / indie: full band
    return [
      { x: -4, instrument: 'guitar' as const },
      { x: -1.3, instrument: 'mic' as const },
      { x: 1.3, instrument: 'guitar' as const },
      { x: 4, instrument: 'guitar' as const },
    ];
  }, [concert.genre]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 6 + Math.abs(Math.sin(t * concert.bpm)) * 10 * concert.energy;
    if (l1.current) {
      l1.current.position.x = Math.sin(t * concert.bpm * 0.4) * 6;
      l1.current.intensity = pulse;
    }
    if (l2.current) {
      l2.current.position.x = Math.cos(t * concert.bpm * 0.35) * 6;
      l2.current.intensity = pulse * 0.8;
    }
  });

  return (
    <group position={[0, 0, stageZ]}>
      {/* riser */}
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROOM.W - 6, 0.5, 3.4]} />
        <meshStandardMaterial color="#101014" roughness={0.9} />
      </mesh>
      {/* backdrop */}
      <mesh position={[0, 2.6, -1.6]}>
        <planeGeometry args={[ROOM.W - 6, 4.6]} />
        <meshStandardMaterial color={concert.backdrop} />
      </mesh>
      {/* poster: genre + band */}
      <BillboardLabel position={[0, 3.6, -1.4]} fontSize={0.7} color={concert.light} outlineWidth={0.06} maxWidth={ROOM.W - 8}>
        {`${concert.label.toUpperCase()}\n${concert.band}`}
      </BillboardLabel>
      {/* stacks */}
      <mesh position={[-(ROOM.W - 6) / 2 + 1, 0.9, 0.6]} castShadow>
        <boxGeometry args={[1.2, 1.5, 1.2]} />
        <meshStandardMaterial color="#08080a" />
      </mesh>
      <mesh position={[(ROOM.W - 6) / 2 - 1, 0.9, 0.6]} castShadow>
        <boxGeometry args={[1.2, 1.5, 1.2]} />
        <meshStandardMaterial color="#08080a" />
      </mesh>
      {/* band */}
      {members.map((m, i) => (
        <BandMember key={i} x={m.x} instrument={m.instrument} color={concert.wash} beat={concert.bpm} energy={concert.energy} />
      ))}
      {/* beat-synced lights */}
      <spotLight ref={l1} position={[-4, 5.2, 3]} angle={0.6} penumbra={0.6} color={concert.light} distance={26} intensity={8} target-position={[0, 0.5, 0]} castShadow />
      <spotLight ref={l2} position={[4, 5.2, 3]} angle={0.6} penumbra={0.6} color={concert.wash} distance={26} intensity={6} target-position={[0, 0.5, 0]} />
      {/* haze */}
      <mesh position={[0, 2.4, 3]}>
        <planeGeometry args={[ROOM.W, ROOM.H]} />
        <meshBasicMaterial color={concert.wash} transparent opacity={0.12 * concert.haze} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Optional seeded décor so two venues of the same theme never look identical. */
function Extras({ seed, accent }: { seed: number; accent: string }): React.JSX.Element {
  const hasPool = (seed & 1) === 1;
  const hasBooths = ((seed >> 1) & 1) === 1;
  const rugHue = (seed >> 2) % 360;
  return (
    <group>
      {/* floor rug — colour varies per venue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM.W / 2 - 4.5, 0.01, 2]} receiveShadow>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color={`hsl(${rugHue},35%,28%)`} roughness={1} />
      </mesh>
      {hasPool && (
        <group position={[ROOM.W / 2 - 4.5, 0, 2]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[2.6, 0.5, 1.4]} />
            <meshStandardMaterial color="#1f5c3a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[2.9, 0.5, 1.7]} />
            <meshStandardMaterial color="#3a2a1c" />
          </mesh>
        </group>
      )}
      {hasBooths &&
        Array.from({ length: 3 }).map((_, i) => (
          <group key={i} position={[-ROOM.W / 2 + 2, 0, -3 + i * 3]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[1.6, 1.2, 2]} />
              <meshStandardMaterial color={accent} roughness={0.6} />
            </mesh>
            <mesh position={[1.1, 0.5, 0]}>
              <boxGeometry args={[1.4, 0.1, 1.6]} />
              <meshStandardMaterial color="#2a1c12" />
            </mesh>
          </group>
        ))}
    </group>
  );
}

export function NightlifeInterior({ venue }: { venue: Venue }): React.JSX.Element {
  const theme = THEMES[venue.theme];
  const { camera } = useThree();
  const seed = useMemo(() => venueSeed(venue.id), [venue.id]);
  const concert = useMemo<ConcertDef | null>(
    () => (isConcertVenue(venue) ? currentConcert(venue.id) : null),
    [venue],
  );

  const walker = useWalker({ x: 0, z: DOOR_Z - 3, angle: Math.PI });
  const zone = useRef<'bar' | 'exit' | null>(null);
  const lastKey = useRef('');

  const beat = concert ? concert.bpm : 0;
  const energy = concert ? concert.energy : 0;

  const patrons = useMemo<PatronData[]>(() => {
    const rng = (n: number): number => (Math.sin(n * 999.7 + seed) * 43758.5453) % 1;
    const arr: PatronData[] = [];
    const base = venue.kind === 'club' ? 9 : 5;
    const count = base + (concert ? concert.crowd : (seed % 3) - 1);
    for (let i = 0; i < count; i++) {
      const rx = (Math.abs(rng(i + 1)) - 0.5) * (ROOM.W - 6);
      const rz = (Math.abs(rng(i + 7)) - 0.3) * (ROOM.D - 7);
      arr.push({ x: rx, z: rz, color: PATRON_COLORS[i % PATRON_COLORS.length]!, sway: 1 + Math.abs(rng(i + 3)) * 3 });
    }
    return arr;
  }, [venue.kind, seed, concert]);

  useKeyPress('e', () => {
    const s = useGame.getState();
    if (zone.current === 'exit') s.exitInterior();
    else if (zone.current === 'bar') s.buyDrink(venue);
  });

  useEffect(() => {
    useGame.getState().setNearby(null);
  }, [venue.id]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    walker.update(dt, ROOM.W / 2 - 1, ROOM.D / 2 - 1);
    const p = walker.pos;

    const camZ = Math.min(ROOM.D / 2 - 1.5, p.z + 6.5);
    camDesired.set(p.x * 0.55, 4.6, camZ);
    camera.position.lerp(camDesired, 1 - Math.pow(0.002, dt));
    camTarget.set(p.x * 0.4, 1.5, p.z - 3);
    camera.lookAt(camTarget);

    const dBar = Math.hypot(p.x - 0, p.z - BAR_FRONT);
    const dExit = Math.hypot(p.x - 0, p.z - (DOOR_Z - 1));
    let z: 'bar' | 'exit' | null = null;
    let label = '';
    if (dExit < 2.4) {
      z = 'exit';
      label = 'Gå ut på gatan';
    } else if (dBar < 3.2 && p.z < 0) {
      z = 'bar';
      label = `Beställ i baren (${venue.name})`;
    }
    zone.current = z;
    const key = z ? z + label : '';
    if (key !== lastKey.current) {
      lastKey.current = key;
      useGame.getState().setNearby(z ? { kind: z, label } : null);
    }
  });

  const wallColor = concert ? concert.backdrop : theme.wall;
  const accentColor = concert ? concert.light : theme.accent;

  return (
    <group>
      <ambientLight intensity={concert ? 0.18 : 0.35} color={concert ? concert.wash : theme.ambient} />
      <hemisphereLight args={['#ffffff', '#101014', 0.25]} />
      <pointLight position={[0, ROOM.H - 0.6, 3]} intensity={2.2} color={theme.ambient} distance={26} castShadow />
      <pointLight position={[-6, 3, 4]} intensity={1.4} color={accentColor} distance={16} />
      <pointLight position={[6, 3, 4]} intensity={1.4} color={accentColor} distance={16} />

      {theme.dancefloor && !concert && <DiscoLights color={theme.accent} />}

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.W, ROOM.D]} />
        <meshStandardMaterial color={theme.floor} roughness={0.85} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.H, 0]}>
        <planeGeometry args={[ROOM.W, ROOM.D]} />
        <meshStandardMaterial color="#0a0a0d" roughness={1} />
      </mesh>
      {/* walls */}
      <mesh position={[0, ROOM.H / 2, -ROOM.D / 2]} receiveShadow>
        <boxGeometry args={[ROOM.W, ROOM.H, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, ROOM.H / 2, ROOM.D / 2]} receiveShadow>
        <boxGeometry args={[ROOM.W, ROOM.H, 0.3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[-ROOM.W / 2, ROOM.H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.3, ROOM.H, ROOM.D]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[ROOM.W / 2, ROOM.H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.3, ROOM.H, ROOM.D]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* bar counter */}
      <group position={[0, 0, BAR_Z]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[ROOM.W - 6, 1.1, 1.1]} />
          <meshStandardMaterial color={theme.accent} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.16, 0]}>
          <boxGeometry args={[ROOM.W - 5.8, 0.08, 1.3]} />
          <meshStandardMaterial color="#101013" roughness={0.3} metalness={0.4} />
        </mesh>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={i} position={[-(ROOM.W - 8) / 2 + i * ((ROOM.W - 8) / 13), 1.7, -0.5]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshStandardMaterial
              color={`hsl(${(i * 40) % 360},60%,55%)`}
              emissive={`hsl(${(i * 40) % 360},60%,30%)`}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.9, -0.6]}>
          <boxGeometry args={[ROOM.W - 6, 0.06, 0.4]} />
          <meshStandardMaterial color="#1a1a1f" />
        </mesh>
      </group>

      {/* stools */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-5 + i * 2, 0.6, BAR_Z + 1.4]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 1.2, 12]} />
          <meshStandardMaterial color="#26262c" />
        </mesh>
      ))}

      {concert ? <ConcertStage concert={concert} /> : theme.stage && <Stage accent={theme.accent} />}
      {theme.dancefloor && !concert && <DanceFloor accent={theme.accent} />}

      <Extras seed={seed} accent={theme.accent} />

      {/* patrons */}
      {patrons.map((p, i) => (
        <Patron key={i} {...p} beat={beat} energy={energy} />
      ))}

      {/* exit door glow */}
      <group position={[0, 0, DOOR_Z]}>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.2, 2.8, 0.12]} />
          <meshStandardMaterial color="#0c0c0f" emissive="#39ff88" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* interior player avatar */}
      <Character groupRef={walker.avatarRef} legLRef={walker.legLRef} legRRef={walker.legRRef} />
    </group>
  );
}
