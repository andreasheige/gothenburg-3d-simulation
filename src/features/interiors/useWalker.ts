import { useRef } from 'react';
import * as THREE from 'three';
import { input } from '@/core/systems/input';

/** Live position of the interior avatar (mutated each frame, kept out of state). */
export interface WalkerPos {
  x: number;
  z: number;
  angle: number;
}

export interface Walker {
  readonly pos: WalkerPos;
  readonly avatarRef: React.RefObject<THREE.Group | null>;
  readonly legLRef: React.RefObject<THREE.Mesh | null>;
  readonly legRRef: React.RefObject<THREE.Mesh | null>;
  /**
   * Advance the avatar from WASD/arrow input, clamped to a rectangular room of
   * half-extents `bx` × `bz` (metres). Call once per frame from the scene.
   */
  update: (dt: number, bx: number, bz: number, speed?: number) => void;
}

/**
 * Shared interior locomotion: an avatar that walks on the floor plane with a
 * leg-swing animation, reused by every interior scene (nightlife, fish market,
 * Liseberg). The scene owns the camera; this only owns the figure.
 */
export function useWalker(start: WalkerPos): Walker {
  const pos = useRef<WalkerPos>({ ...start }).current;
  const avatarRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);
  const walk = useRef(0);

  const update = (dt: number, bx: number, bz: number, speed = 6): void => {
    const ax = input.axis();
    if (ax.x !== 0 || ax.z !== 0) {
      const len = Math.hypot(ax.x, ax.z) || 1;
      const dx = ax.x / len;
      const dz = ax.z / len;
      pos.x = THREE.MathUtils.clamp(pos.x + dx * speed * dt, -bx, bx);
      pos.z = THREE.MathUtils.clamp(pos.z + dz * speed * dt, -bz, bz);
      pos.angle = Math.atan2(dx, dz);
      walk.current += dt * speed * 1.4;
    }
    const av = avatarRef.current;
    if (av) {
      av.position.set(pos.x, 0, pos.z);
      av.rotation.y = pos.angle;
      const swing = Math.sin(walk.current) * 0.6;
      if (legLRef.current) legLRef.current.rotation.x = swing;
      if (legRRef.current) legRRef.current.rotation.x = -swing;
    }
  };

  return { pos, avatarRef, legLRef, legRRef, update };
}
