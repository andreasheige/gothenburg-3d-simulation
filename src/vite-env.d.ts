/// <reference types="vite/client" />

import type { useGame } from '@/state/store';

declare global {
  interface Window {
    __game?: typeof useGame;
  }
}

export {};
