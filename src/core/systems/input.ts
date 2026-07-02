// Global keyboard input singleton. Attaches listeners once.
// `held` = keys currently down (for continuous movement).
// `on(key, cb)` = one-shot key press events (for actions like E / Esc / M).

type Callback = () => void;

const held = new Set<string>();
const listeners = new Map<string, Set<Callback>>();

const MOVEMENT_KEYS = new Set([
  'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ',
]);

let attached = false;

function normalize(key: string): string {
  return key.toLowerCase();
}

function attach(): void {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const k = normalize(e.key);
    if (MOVEMENT_KEYS.has(k)) e.preventDefault();
    if (!held.has(k)) {
      const set = listeners.get(k);
      if (set) for (const cb of set) cb();
    }
    held.add(k);
  });
  window.addEventListener('keyup', (e: KeyboardEvent) => held.delete(normalize(e.key)));
  window.addEventListener('blur', () => held.clear());
}

/** Two-axis movement vector in the range [-1, 1] on each axis. */
export interface Axis {
  x: number;
  z: number;
}

export const input = {
  attach,
  /** True if any of the given (already lower-cased) keys is currently held. */
  isDown(...keys: string[]): boolean {
    for (const k of keys) if (held.has(k)) return true;
    return false;
  },
  /** Register a one-shot press handler; returns an unsubscribe function. */
  on(key: string, cb: Callback): () => void {
    const k = key.toLowerCase();
    let set = listeners.get(k);
    if (!set) {
      set = new Set<Callback>();
      listeners.set(k, set);
    }
    set.add(cb);
    return () => {
      listeners.get(k)?.delete(cb);
    };
  },
  /** Movement axis from WASD / arrow keys. */
  axis(): Axis {
    let x = 0;
    let z = 0;
    if (this.isDown('w', 'arrowup')) z -= 1;
    if (this.isDown('s', 'arrowdown')) z += 1;
    if (this.isDown('a', 'arrowleft')) x -= 1;
    if (this.isDown('d', 'arrowright')) x += 1;
    return { x, z };
  },
};
