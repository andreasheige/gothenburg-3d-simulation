import type { TouristRuntime, TramRuntime } from '@/core/types';

// Shared runtime registries for dynamic entities that systems need to query
// (kept outside React/zustand to avoid per-frame re-renders).
export interface Registry {
  readonly trams: TramRuntime[];
  readonly tourists: TouristRuntime[];
}

export const registry: Registry = {
  trams: [],
  tourists: [],
};
