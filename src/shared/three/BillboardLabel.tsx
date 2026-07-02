import { Billboard, Text } from '@react-three/drei';
import type { ReactNode } from 'react';

export interface BillboardLabelProps {
  children: ReactNode;
  position?: [number, number, number];
  fontSize?: number;
  color?: string;
  outlineWidth?: number;
  outlineColor?: string;
  maxWidth?: number;
}

/**
 * A camera-facing text label with an outline. Reused by stations, landmarks and
 * venue signage so the billboard + outline setup lives in one place.
 */
export function BillboardLabel({
  children,
  position = [0, 0, 0],
  fontSize = 1,
  color = '#ffffff',
  outlineWidth = 0.05,
  outlineColor = '#000000',
  maxWidth = 100,
}: BillboardLabelProps): React.JSX.Element {
  return (
    <Billboard position={position}>
      <Text
        fontSize={fontSize}
        color={color}
        outlineWidth={outlineWidth}
        outlineColor={outlineColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={maxWidth}
      >
        {children}
      </Text>
    </Billboard>
  );
}
