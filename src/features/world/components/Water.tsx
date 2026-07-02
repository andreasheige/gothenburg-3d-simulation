import { useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import type { GeoArea } from '@/domain/geo/snapshot';
import { geo } from '@/core/systems/geoWorld';
import { buildAreaGeometry } from '../geometry';

// Göta älv, canals and harbour basins — real OSM water polygons rendered as one
// reflective surface. Water is visual only (bridges stay walkable).
export function Water(): React.JSX.Element {
  const water = useMemo(() => {
    const areas: GeoArea[] = geo().snapshot.water.map((ring) => ({ p: ring }));
    return buildAreaGeometry(areas, 0.1);
  }, []);

  return (
    <mesh geometry={water}>
      <MeshReflectorMaterial
        resolution={512}
        mixBlur={1}
        mixStrength={5}
        blur={[300, 80]}
        roughness={0.85}
        depthScale={1.1}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        color="#1d4f6e"
        metalness={0.5}
      />
    </mesh>
  );
}
