import { useMemo } from 'react';
import type { GeoRoad } from '@/domain/geo/snapshot';
import { COLORS } from '@/core/config/world';
import { geo } from '@/core/systems/geoWorld';
import {
  buildRibbonGeometry,
  buildDashedGeometry,
  buildRailsGeometry,
} from '../geometry';

const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary']);
const MINOR = new Set(['tertiary', 'unclassified', 'residential', 'living_street', 'service']);
const FOOT = new Set(['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'track']);

// Real OSM street network rendered as layered ribbons: light kerb/sidewalk
// bands underneath asphalt carriageways, dashed centre lines on the arterials,
// and ballasted twin-rail tram tracks.
export function Roads(): React.JSX.Element {
  const majorRoads = useMemo(() => geo().snapshot.roads.filter((r) => MAJOR.has(r.k)), []);
  const minorRoads = useMemo(() => geo().snapshot.roads.filter((r) => MINOR.has(r.k)), []);
  const footRoads = useMemo(() => geo().snapshot.roads.filter((r) => FOOT.has(r.k)), []);

  // sidewalk/kerb bands: wider, lower ribbons that peek out beyond the asphalt
  const majorWalk = useMemo(() => buildRibbonGeometry(majorRoads, 15.5, 0.045), [majorRoads]);
  const minorWalk = useMemo(() => buildRibbonGeometry(minorRoads, 9.5, 0.04), [minorRoads]);

  const major = useMemo(() => buildRibbonGeometry(majorRoads, 11, 0.075), [majorRoads]);
  const minor = useMemo(() => buildRibbonGeometry(minorRoads, 6.5, 0.065), [minorRoads]);
  const foot = useMemo(() => buildRibbonGeometry(footRoads, 2.4, 0.05), [footRoads]);

  const lanes = useMemo(() => buildDashedGeometry(majorRoads, 3, 4.5, 0.28, 0.09), [majorRoads]);

  const tracks = useMemo(() => geo().snapshot.tramTracks, []);
  const ballast = useMemo(() => {
    const rs: GeoRoad[] = tracks.map((p) => ({ k: 'rail', p }));
    return buildRibbonGeometry(rs, 3.2, 0.085);
  }, [tracks]);
  const rails = useMemo(() => buildRailsGeometry(tracks, 2.0, 0.2, 0.13), [tracks]);

  return (
    <group>
      <mesh geometry={majorWalk} receiveShadow>
        <meshStandardMaterial color={COLORS.pavement} roughness={1} />
      </mesh>
      <mesh geometry={minorWalk} receiveShadow>
        <meshStandardMaterial color={COLORS.pavement} roughness={1} />
      </mesh>
      <mesh geometry={major} receiveShadow>
        <meshStandardMaterial color={COLORS.road} roughness={0.95} />
      </mesh>
      <mesh geometry={minor} receiveShadow>
        <meshStandardMaterial color="#464b52" roughness={0.96} />
      </mesh>
      <mesh geometry={foot} receiveShadow>
        <meshStandardMaterial color={COLORS.pavement} roughness={1} />
      </mesh>
      <mesh geometry={lanes}>
        <meshStandardMaterial color="#d8d2bd" roughness={0.8} emissive="#3a3627" emissiveIntensity={0.35} />
      </mesh>
      <mesh geometry={ballast} receiveShadow>
        <meshStandardMaterial color="#4c4842" roughness={1} />
      </mesh>
      <mesh geometry={rails}>
        <meshStandardMaterial color="#3a3f47" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}
