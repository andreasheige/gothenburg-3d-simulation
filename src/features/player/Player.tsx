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
  const wasRiding = useRef(false); // detect board/exit transitions
  const marker = useRef<THREE.Mesh>(null); // walk-to destination ring
  const pulse = useRef(0);

  // Mouse-drag orbit + wheel zoom, bound to the WebGL canvas. A left click/tap
  // that doesn't drag (below CLICK_PX of motion) instead raycasts to the ground
  // and sets a walk-to destination (see the movement loop below).
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let px = 0;
    let py = 0;
    let downX = 0;
    let downY = 0;
    let downBtn = 0;
    let moved = 0;

    const CLICK_PX = 6;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();

    const onDown = (e: PointerEvent): void => {
      if (e.button !== 0 && e.button !== 2) return;
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downBtn = e.button;
      moved = 0;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw.current -= dx * 0.005;
      pitch.current = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch.current - dy * 0.004));
    };
    const onUp = (e: PointerEvent): void => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
      // A left click/tap that barely moved = walk-to command, not a camera orbit.
      const travel = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
      if (downBtn === 0 && moved < CLICK_PX && travel < CLICK_PX && !player.onTram) {
        const rect = el.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(ground, hit)) {
          player.moveTarget = { x: hit.x, z: hit.z };
        }
      }
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
  }, [gl, camera]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const w = geo();
    const riding = !!player.onTram;

    // On boarding / exiting, snap the orbit camera to a sensible pose so the
    // player drops into a 3/4 cutaway view inside the cabin, then walking view.
    if (riding !== wasRiding.current) {
      if (riding) {
        pitch.current = 0.72;
        dist.current = 13;
      } else {
        pitch.current = 0.62;
        dist.current = 17;
      }
      wasRiding.current = riding;
    }

    if (!riding) {
      const ax = input.axis();
      // camera-relative movement
      const moving = ax.x !== 0 || ax.z !== 0;
      if (moving) {
        player.moveTarget = null; // manual input cancels a walk-to destination
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
      } else if (player.moveTarget) {
        // click / tap-to-move: walk straight toward the destination, collision
        // aware. Stop when we arrive or if a wall blocks both axes.
        const tx = player.moveTarget.x;
        const tz = player.moveTarget.z;
        const gx = tx - player.x;
        const gz = tz - player.z;
        const gd = Math.hypot(gx, gz);
        if (gd < 1.1) {
          player.moveTarget = null;
        } else {
          const dx = gx / gd;
          const dz = gz / gd;
          const speed = 8;
          const nx = player.x + dx * speed * dt;
          const nz = player.z + dz * speed * dt;
          let stepped = false;
          if (!w.blocked(nx, player.z, 0.7)) {
            player.x = nx;
            stepped = true;
          }
          if (!w.blocked(player.x, nz, 0.7)) {
            player.z = nz;
            stepped = true;
          }
          player.angle = Math.atan2(dx, dz);
          walkPhase.current += dt * speed * 1.4;
          if (!stepped) player.moveTarget = null; // stuck against geometry
        }
      }
    } else {
      // face along ride; legs still. Keep the camera looking down the aisle by
      // tracking the tram heading, so turns don't leave us staring at a wall.
      player.moveTarget = null;
      walkPhase.current = 0;
      if (player.onTram) yaw.current = player.onTram.angle + 0.6;
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

    // walk-to destination marker: a pulsing ring on the ground at the target.
    if (marker.current) {
      const tgt = player.moveTarget;
      const show = !!tgt && !riding;
      marker.current.visible = show;
      if (tgt) {
        pulse.current += dt * 4;
        const s = 1 + Math.sin(pulse.current) * 0.18;
        marker.current.position.set(tgt.x, 0.06, tgt.z);
        marker.current.scale.set(s, s, 1);
      }
    }

    // spherical follow camera (yaw + pitch + zoom)
    const baseDist = dist.current;
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

  return (
    <>
      <Character groupRef={group} legLRef={legL} legRRef={legR} />
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.9, 1.3, 32]} />
        <meshBasicMaterial color="#ffd500" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </>
  );
}
