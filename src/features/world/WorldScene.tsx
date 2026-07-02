import { Lighting } from './components/Lighting';
import { Ground } from './components/Ground';
import { Water } from './components/Water';
import { Roads } from './components/Roads';
import { Buildings } from './components/Buildings';
import { Landmarks } from './components/Landmarks';
import { StreetLabels } from './components/StreetLabels';
import { VenueDoors } from './components/VenueDoors';
import { TramSystem } from '@/features/transit/TramSystem';
import { Pedestrians } from '@/features/npcs/Pedestrians';
import { Seagulls } from '@/features/npcs/Seagulls';
import { Player } from '@/features/player/Player';
import { Systems } from '@/features/systems/Systems';

/** The full open-world Gothenburg scene. */
export function WorldScene(): React.JSX.Element {
  return (
    <group>
      <Lighting />
      <Ground />
      <Water />
      <Roads />
      <Buildings />
      <Landmarks />
      <StreetLabels />
      <VenueDoors />
      <TramSystem />
      <Pedestrians />
      <Seagulls />
      <Player />
      <Systems />
    </group>
  );
}
