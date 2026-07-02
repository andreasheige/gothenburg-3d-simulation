import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '@/state/store';
import { input } from '@/core/systems/input';
import { blocked, hitsBuilding } from '@/core/systems/worldgen';
import { Character } from '@/shared/three/Character';

const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();

// Third-person avatar with WASD movement (camera-relative) + smooth follow camera.
export function Player(): React.JSX.Element {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const walkPhase = useRef(0);
  const yaw = useRef(0.6); // camera orbit yaw around player

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const riding = !!player.onTram;

    if (!riding) {
      const ax = input.axis();
      // camera-relative movement
      const moving = ax.x !== 0 || ax.z !== 0;
      if (moving) {
        const sin = Math.sin(yaw.current);
        const cos = Math.cos(yaw.current);
        let dx = ax.x * cos - ax.z * sin;
        let dz = ax.x * sin + ax.z * cos;
        const len = Math.hypot(dx, dz) || 1;
        dx /= len;
        dz /= len;
        const speed = input.isDown('shift') ? 11 : 6.5;
        const nx = player.x + dx * speed * dt;
        const nz = player.z + dz * speed * dt;
        if (!blocked(nx, player.z, 0.7)) player.x = nx;
        if (!blocked(player.x, nz, 0.7)) player.z = nz;
        player.angle = Math.atan2(dx, dz);
        walkPhase.current += dt * speed * 1.4;
      }
    } else {
      // face along ride; legs still
      walkPhase.current = 0;
    }

    // place avatar
    if (group.current) {
      group.current.position.set(player.x, riding ? 1.2 : 0, player.z);
      group.current.rotation.y = player.angle;
      const swing = Math.sin(walkPhase.current) * 0.6;
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      group.current.visible = !riding;
    }

    // follow camera: orbit yaw with Q / R
    if (input.isDown('q')) yaw.current -= dt * 1.6;
    if (input.isDown('r')) yaw.current += dt * 1.6;

    const height = riding ? 15 : 11;
    const dirx = -Math.sin(yaw.current);
    const dirz = -Math.cos(yaw.current);
    let dist = riding ? 22 : 15;
    // camera collision: pull the camera in if it would clip a building
    for (let s = 1; s <= 10; s++) {
      const t = dist * (s / 10);
      if (hitsBuilding(player.x + dirx * t, player.z + dirz * t, 1.0)) {
        dist = Math.max(5, dist * ((s - 1) / 10));
        break;
      }
    }
    camDesired.set(player.x + dirx * dist, height, player.z + dirz * dist);
    camera.position.lerp(camDesired, 1 - Math.pow(0.0001, dt));
    camTarget.set(player.x, 2.4, player.z);
    camera.lookAt(camTarget);
  });

  return <Character groupRef={group} legLRef={legL} legRRef={legR} />;
}
