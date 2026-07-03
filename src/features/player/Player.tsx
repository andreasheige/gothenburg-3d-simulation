import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '@/state/store';
import { input } from '@/core/systems/input';
import { geo } from '@/core/systems/geoWorld';
import { Character } from '@/shared/three/Character';

const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();

const PITCH_MIN = 0.16;
const PITCH_MAX = 1.32;
const DIST_MIN = 6;
const DIST_MAX = 46;

// Third-person avatar with WASD movement (camera-relative) plus a smooth follow
// camera the player can orbit with the mouse (drag), zoom with the wheel, and
// nudge with Q/R (yaw) and Z/X (pitch).
export function Player(): React.JSX.Element {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const walkPhase = useRef(0);
  const yaw = useRef(0.6); // camera orbit yaw around the player
  const pitch = useRef(0.62); // camera elevation angle
  const dist = useRef(17); // camera distance (zoom)

  // Mouse-drag orbit + wheel zoom, bound to the WebGL canvas.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let px = 0;
    let py = 0;

    const onDown = (e: PointerEvent): void => {
      if (e.button !== 0 && e.button !== 2) return;
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;
      yaw.current -= dx * 0.005;
      pitch.current = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch.current - dy * 0.004));
    };
    const onUp = (e: PointerEvent): void => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      dist.current = Math.max(DIST_MIN, Math.min(DIST_MAX, dist.current * (1 + e.deltaY * 0.0012)));
    };
    const onCtx = (e: Event): void => e.preventDefault();

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onCtx);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onCtx);
    };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const w = geo();
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
        const speed = input.isDown('shift') ? 15 : 8;
        const nx = player.x + dx * speed * dt;
        const nz = player.z + dz * speed * dt;
        if (!w.blocked(nx, player.z, 0.7)) player.x = nx;
        if (!w.blocked(player.x, nz, 0.7)) player.z = nz;
        player.angle = Math.atan2(dx, dz);
        walkPhase.current += dt * speed * 1.4;
      }
    } else {
      // face along ride; legs still
      walkPhase.current = 0;
    }

    // keyboard camera nudge (mouse drag is the primary control)
    if (input.isDown('q')) yaw.current -= dt * 1.8;
    if (input.isDown('r')) yaw.current += dt * 1.8;
    if (input.isDown('z')) pitch.current = Math.max(PITCH_MIN, pitch.current - dt * 1.2);
    if (input.isDown('x')) pitch.current = Math.min(PITCH_MAX, pitch.current + dt * 1.2);
    player.camYaw = yaw.current;

    // place avatar
    if (group.current) {
      group.current.position.set(player.x, riding ? 1.2 : 0, player.z);
      group.current.rotation.y = player.angle;
      const swing = Math.sin(walkPhase.current) * 0.6;
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      group.current.visible = !riding;
    }

    // spherical follow camera (yaw + pitch + zoom)
    const baseDist = riding ? Math.max(dist.current, 20) : dist.current;
    const cp = Math.cos(pitch.current);
    const sp = Math.sin(pitch.current);
    const dirx = -Math.sin(yaw.current);
    const dirz = -Math.cos(yaw.current);
    let horiz = cp * baseDist;
    const vert = sp * baseDist;
    // camera collision: pull the camera in if it would clip a building
    for (let s = 1; s <= 10; s++) {
      const t = horiz * (s / 10);
      if (w.blocked(player.x + dirx * t, player.z + dirz * t, 1.0)) {
        horiz = Math.max(3, horiz * ((s - 1) / 10));
        break;
      }
    }
    camDesired.set(player.x + dirx * horiz, 2.4 + vert, player.z + dirz * horiz);
    camera.position.lerp(camDesired, 1 - Math.pow(0.0001, dt));
    camTarget.set(player.x, 2.4, player.z);
    camera.lookAt(camTarget);
  });

  return <Character groupRef={group} legLRef={legL} legRRef={legR} />;
}
