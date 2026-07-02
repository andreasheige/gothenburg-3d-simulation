import { useEffect, useRef } from 'react';
import { input } from '@/core/systems/input';

/**
 * Register a one-shot key-press handler for the lifetime of the component.
 * The latest `handler` closure is always invoked, so callers don't need to
 * manage dependency arrays for the callback.
 */
export function useKeyPress(key: string, handler: () => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => input.on(key, () => ref.current()), [key]);
}
