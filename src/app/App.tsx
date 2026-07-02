import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame } from '@/state/store';
import { input } from '@/core/systems/input';
import { WorldScene } from '@/features/world/WorldScene';
import { InteriorScene } from '@/features/interiors/InteriorScene';
import { Hud } from '@/features/hud/Hud';
import { Loader } from '@/shared/ui/Loader';

export function App(): React.JSX.Element {
  const scene = useGame((s) => s.scene);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    input.attach();
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.5, far: 1200, position: [60, 40, 120] }}
      >
        <color attach="background" args={['#0a0f14']} />
        <fog attach="fog" args={['#0a0f14', 180, 520]} />
        <Suspense fallback={null}>{scene === 'city' ? <WorldScene /> : <InteriorScene />}</Suspense>
      </Canvas>
      {!ready && <Loader />}
      <Hud />
    </>
  );
}
