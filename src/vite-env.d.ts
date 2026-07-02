/// <reference types="vite/client" />

import type { useGame } from '@/state/store';
import type { PlayerTransform } from '@/state/store';

declare global {
  interface Window {
    __game?: typeof useGame;
    __player?: PlayerTransform;
  }
}

export {};
