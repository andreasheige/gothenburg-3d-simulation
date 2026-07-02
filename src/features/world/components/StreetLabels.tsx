import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { Pt } from '@/domain/geo/snapshot';
import { geo } from '@/core/systems/geoWorld';

const LABELABLE = new Set(['primary', 'secondary', 'tertiary', 'residential', 'pedestrian', 'living_street']);

interface Label {
  name: string;
  x: number;
  z: number;
  rot: number;
}

function polyLen(p: readonly Pt[]): number {
  let d = 0;
  for (let i = 1; i < p.length; i++) d += Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]);
  return d;
}

// Floating name plates for the major named streets. One label per unique street
// name (the longest instance), capped for legibility + performance.
export function StreetLabels(): React.JSX.Element {
  const labels = useMemo<Label[]>(() => {
    const longest = new Map<string, { p: readonly Pt[]; len: number }>();
    for (const r of geo().snapshot.roads) {
      if (!r.n || !LABELABLE.has(r.k) || r.p.length < 2) continue;
      const len = polyLen(r.p);
      const prev = longest.get(r.n);
      if (!prev || len > prev.len) longest.set(r.n, { p: r.p, len });
    }
    const picked = [...longest.entries()]
      .filter(([, v]) => v.len > 90)
      .sort((a, b) => b[1].len - a[1].len)
      .slice(0, 70);

    return picked.map(([name, { p }]) => {
      const mid = p[Math.floor(p.length / 2)]!;
      const a = p[Math.max(0, Math.floor(p.length / 2) - 1)]!;
      const b = p[Math.min(p.length - 1, Math.floor(p.length / 2) + 1)]!;
      const rot = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      return { name, x: mid[0], z: mid[1], rot };
    });
  }, []);

  return (
    <group>
      {labels.map((s, i) => (
        <Text
          key={i}
          position={[s.x, 1.4, s.z]}
          rotation={[-Math.PI / 2, 0, s.rot]}
          fontSize={7}
          color="#eef2f6"
          fillOpacity={0.55}
          outlineWidth={0.2}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {s.name}
        </Text>
      ))}
    </group>
  );
}
