import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VENUES, SHOPS } from '@/domain/venues';
import { currentConcert, isConcertVenue } from '@/domain/interiors';
import { useGame } from '@/state/store';
import { BillboardLabel } from '@/shared/three/BillboardLabel';
import type { Shop as ShopData, Venue as VenueData, VenueKind, ShopKind } from '@/core/types';

const KIND_COLOR: Record<VenueKind, string> = { club: '#ff4fa3', bar: '#ffb347' };
const SHOP_COLOR: Record<ShopKind, string> = {
  cafe: '#caa06a',
  kiosk: '#e0a24f',
  fish: '#5fb0d0',
  shop: '#b98fd0',
  pawn: '#e0c24f',
};

function Venue({ v }: { v: VenueData }): React.JSX.Element {
  const glowRef = useRef<THREE.PointLight>(null);
  const color = KIND_COLOR[v.kind];
  const concert = isConcertVenue(v) ? currentConcert(v.id) : null;
  useFrame((state) => {
    if (glowRef.current) {
      const h = (useGame.getState().dayT * 24) % 24;
      const night = h >= 18 || h < 6;
      const base = night ? 2.2 : 0.2;
      glowRef.current.intensity = base + (night ? Math.sin(state.clock.elapsedTime * 4 + v.x) * 0.5 : 0);
    }
  });
  return (
    <group position={[v.x, 0, v.z]}>
      {/* facade */}
      <mesh position={[0, 2.4, -0.9]} castShadow>
        <boxGeometry args={[3.6, 4.8, 1.4]} />
        <meshStandardMaterial color={v.kind === 'club' ? '#2a2030' : '#3a2e24'} roughness={0.85} />
      </mesh>
      {/* doorway */}
      <mesh position={[0, 1.3, -0.15]}>
        <boxGeometry args={[1.5, 2.6, 0.3]} />
        <meshStandardMaterial color="#0c0c10" emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* neon sign */}
      <mesh position={[0, 4.2, -0.05]}>
        <boxGeometry args={[3.4, 0.9, 0.2]} />
        <meshStandardMaterial color="#111111" emissive={color} emissiveIntensity={1.4} />
      </mesh>
      <BillboardLabel position={[0, 4.2, 0.2]} fontSize={0.62} maxWidth={5}>
        {v.name}
      </BillboardLabel>
      {concert && (
        <BillboardLabel position={[0, 3.5, 0.2]} fontSize={0.4} color={concert.light} outlineWidth={0.03} maxWidth={6}>
          {`🎫 ikväll: ${concert.label}`}
        </BillboardLabel>
      )}
      <pointLight ref={glowRef} position={[0, 2.6, 1]} color={color} distance={12} intensity={0.4} />
    </group>
  );
}

function Shop({ s }: { s: ShopData }): React.JSX.Element {
  const color = SHOP_COLOR[s.kind];
  return (
    <group position={[s.x, 0, s.z]}>
      <mesh position={[0, 1.4, -0.6]} castShadow>
        <boxGeometry args={[2.6, 2.8, 1]} />
        <meshStandardMaterial color="#4a4038" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.4, 0.1]}>
        <boxGeometry args={[2.8, 0.6, 1.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <BillboardLabel position={[0, 3.3, 0]} fontSize={0.42} outlineWidth={0.04}>
        {s.name}
      </BillboardLabel>
    </group>
  );
}

export function VenueDoors(): React.JSX.Element {
  return (
    <group>
      {VENUES.map((v) => (
        <Venue key={v.id} v={v} />
      ))}
      {SHOPS.map((s) => (
        <Shop key={s.id} s={s} />
      ))}
    </group>
  );
}
