import type { Ref } from 'react';
import type { Group, Mesh } from 'three';

/** Colour palette for a {@link Character}. */
export interface CharacterColors {
  coat: string;
  skin: string;
  hat: string;
  legs: string;
}

const DEFAULT_COLORS: CharacterColors = {
  coat: '#c2402f',
  skin: '#e6b98f',
  hat: '#1f6f52',
  legs: '#2b3550',
};

export interface CharacterProps {
  /** Ref to the whole figure group (position + yaw are set by the caller each frame). */
  groupRef?: Ref<Group>;
  /** Refs to the legs so the caller can drive a walk-swing animation. */
  legLRef?: Ref<Mesh>;
  legRRef?: Ref<Mesh>;
  /** Optional palette overrides. */
  colors?: Partial<CharacterColors>;
}

/**
 * The shared humanoid avatar (torso + head + beanie + two swinging legs).
 * Reused by the open-world player and the interior player avatar.
 */
export function Character({ groupRef, legLRef, legRRef, colors }: CharacterProps): React.JSX.Element {
  const c: CharacterColors = { ...DEFAULT_COLORS, ...colors };
  return (
    <group ref={groupRef ?? null}>
      {/* torso */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.95, 4, 10]} />
        <meshStandardMaterial color={c.coat} roughness={0.7} />
      </mesh>
      {/* head */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={c.skin} roughness={0.7} />
      </mesh>
      {/* beanie */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={c.hat} />
      </mesh>
      {/* legs */}
      <mesh ref={legLRef ?? null} position={[-0.16, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.6, 4, 6]} />
        <meshStandardMaterial color={c.legs} />
      </mesh>
      <mesh ref={legRRef ?? null} position={[0.16, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.6, 4, 6]} />
        <meshStandardMaterial color={c.legs} />
      </mesh>
    </group>
  );
}
