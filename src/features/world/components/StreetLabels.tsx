import { Text } from '@react-three/drei';
import { tx, tz } from '@/core/config/world';
import { STREETS } from '@/domain/streets';

// Floating street-name plates hovering just above the roads.
export function StreetLabels(): React.JSX.Element {
  return (
    <group>
      {STREETS.map((s, i) => (
        <group key={i} position={[tx(s.cx), 1.2, tz(s.cy)]}>
          <Text
            rotation={[-Math.PI / 2, 0, s.dir === 'v' ? Math.PI / 2 : 0]}
            fontSize={1.15}
            color="#e9eef2"
            fillOpacity={0.5}
            outlineWidth={0.03}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {s.name}
          </Text>
        </group>
      ))}
    </group>
  );
}
