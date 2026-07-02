import { useMemo } from 'react';
import type { GeoRoad } from '@/domain/geo/snapshot';
import { COLORS } from '@/core/config/world';
import { geo } from '@/core/systems/geoWorld';
import { buildRibbonGeometry } from '../geometry';

const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary']);
const MINOR = new Set(['tertiary', 'unclassified', 'residential', 'living_street', 'service']);
const FOOT = new Set(['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'track']);

// Real OSM street network rendered as merged asphalt ribbons, split into three
// width/material tiers, plus tram rails drawn from the tram track geometry.
export function Roads(): React.JSX.Element {
  const major = useMemo(() => {
    const rs = geo().snapshot.roads.filter((r) => MAJOR.has(r.k));
    return buildRibbonGeometry(rs, 11, 0.08);
  }, []);
  const minor = useMemo(() => {
    const rs = geo().snapshot.roads.filter((r) => MINOR.has(r.k));
    return buildRibbonGeometry(rs, 6.5, 0.07);
  }, []);
  const foot = useMemo(() => {
    const rs = geo().snapshot.roads.filter((r) => FOOT.has(r.k));
    return buildRibbonGeometry(rs, 2.4, 0.05);
  }, []);
  const rails = useMemo(() => {
    const tracks: GeoRoad[] = geo().snapshot.tramTracks.map((p) => ({ k: 'rail', p }));
    return buildRibbonGeometry(tracks, 1.5, 0.12);
  }, []);

  return (
    <group>
      <mesh geometry={major} receiveShadow>
        <meshStandardMaterial color={COLORS.road} roughness={0.95} />
      </mesh>
      <mesh geometry={minor} receiveShadow>
        <meshStandardMaterial color="#42474d" roughness={0.96} />
      </mesh>
      <mesh geometry={foot} receiveShadow>
        <meshStandardMaterial color={COLORS.pavement} roughness={1} />
      </mesh>
      <mesh geometry={rails}>
        <meshStandardMaterial color="#2b2f36" metalness={0.55} roughness={0.5} />
      </mesh>
    </group>
  );
}
