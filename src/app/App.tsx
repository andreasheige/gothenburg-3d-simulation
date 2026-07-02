import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame, resolveSpawn } from '@/state/store';
import { input } from '@/core/systems/input';
import { loadGeoWorld } from '@/core/systems/geoWorld';
import { WorldScene } from '@/features/world/WorldScene';
import { InteriorScene } from '@/features/interiors/InteriorScene';
import { Hud } from '@/features/hud/Hud';
import { Loader } from '@/shared/ui/Loader';

export function App(): React.JSX.Element {
  const scene = useGame((s) => s.scene);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    input.attach();
    let alive = true;
    void loadGeoWorld().then(() => {
      if (!alive) return;
      resolveSpawn();
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.5, far: 3200, position: [60, 40, 120] }}
      >
        <color attach="background" args={['#0a0f14']} />
        <fog attach="fog" args={['#0a0f14', 320, 1100]} />
        <Suspense fallback={null}>
          {scene === 'interior' ? <InteriorScene /> : ready ? <WorldScene /> : null}
        </Suspense>
      </Canvas>
      {!ready && <Loader />}
      <Hud />
    </>
  );
}
