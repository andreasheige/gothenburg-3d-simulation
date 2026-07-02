import type { Landmark } from '@/core/types';

// 3D landmarks placed around the city. `type` drives the mesh built in the Landmarks feature.
export const LANDMARKS: readonly Landmark[] = [
  { id: 'liseberg', name: 'Liseberg', type: 'ferris', cx: 47, cy: 33 },
  { id: 'feske', name: 'Feskekörka', type: 'church', cx: 18, cy: 13 },
  { id: 'gotaplatsen', name: 'Götaplatsen', type: 'statue', cx: 32, cy: 40 },
  { id: 'brunns', name: 'Brunnsparken', type: 'fountain', cx: 30, cy: 18 },
  { id: 'skansen', name: 'Skansen Kronan', type: 'fort', cx: 6, cy: 28 },
  { id: 'lindholmen', name: 'Lindholmen', type: 'tower', cx: 30, cy: 4 },
  { id: 'eriksberg', name: 'Eriksbergskranen', type: 'crane', cx: 6, cy: 2 },
  { id: 'slottskogen', name: 'Slottskogen', type: 'forest', cx: 7, cy: 17 },
  { id: 'operan', name: 'Göteborgsoperan', type: 'opera', cx: 30, cy: 12 },
  { id: 'ullevi', name: 'Ullevi', type: 'stadium', cx: 42, cy: 24 },
];
