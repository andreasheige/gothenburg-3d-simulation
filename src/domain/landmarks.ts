import type { Landmark } from '@/core/types';
import { project } from '@/domain/geo/meta';

// 3D landmarks at real lon/lat, projected to world metres. `type` drives the mesh
// built in the Landmarks feature.
interface LandmarkSeed {
  readonly id: string;
  readonly name: string;
  readonly type: Landmark['type'];
  readonly lon: number;
  readonly lat: number;
  readonly enterable?: boolean;
}

const LANDMARK_SEEDS: readonly LandmarkSeed[] = [
  { id: 'liseberg', name: 'Liseberg', type: 'ferris', lon: 11.9913, lat: 57.6949, enterable: true },
  { id: 'feske', name: 'Feskekörka', type: 'fishhall', lon: 11.9557, lat: 57.6996, enterable: true },
  { id: 'domkyrkan', name: 'Domkyrkan', type: 'church', lon: 11.9646, lat: 57.705 },
  { id: 'gotaplatsen', name: 'Götaplatsen', type: 'statue', lon: 11.9793, lat: 57.6975 },
  { id: 'gustafadolf', name: 'Gustaf Adolfs Torg', type: 'fountain', lon: 11.9668, lat: 57.7066 },
  { id: 'skansen', name: 'Skansen Kronan', type: 'fort', lon: 11.952, lat: 57.6975 },
  { id: 'lilla-bommen', name: 'Läppstiftet', type: 'tower', lon: 11.969, lat: 57.7115 },
  { id: 'eriksberg', name: 'Eriksbergskranen', type: 'crane', lon: 11.92, lat: 57.705 },
  { id: 'slottskogen', name: 'Slottskogen', type: 'forest', lon: 11.943, lat: 57.6857 },
  { id: 'operan', name: 'Göteborgsoperan', type: 'opera', lon: 11.9695, lat: 57.7108 },
  { id: 'ullevi', name: 'Ullevi', type: 'stadium', lon: 11.987, lat: 57.7069 },
];

export const LANDMARKS: readonly Landmark[] = LANDMARK_SEEDS.map((l) => {
  const { x, z } = project(l.lon, l.lat);
  const base = { id: l.id, name: l.name, type: l.type, x, z };
  return l.enterable === undefined ? base : { ...base, enterable: l.enterable };
});
