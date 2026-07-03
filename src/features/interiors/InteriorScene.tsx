import { useGame } from '@/state/store';
import { resolveInterior } from '@/domain/interiors';
import { NightlifeInterior } from './NightlifeInterior';
import { FishMarketInterior } from './FishMarketInterior';
import { LisebergInterior } from './LisebergInterior';

/**
 * Interior dispatcher: resolves the current `interiorId` to a scene kind and
 * renders the matching interior. Nightlife venues share one themed room;
 * Feskekörka and Liseberg get bespoke scenes.
 */
export function InteriorScene(): React.JSX.Element | null {
  const interiorId = useGame((s) => s.interiorId);
  const def = resolveInterior(interiorId);
  if (!def) return null;
  switch (def.kind) {
    case 'fishmarket':
      return <FishMarketInterior />;
    case 'amusement':
      return <LisebergInterior />;
    case 'nightlife':
      return <NightlifeInterior venue={def.venue} />;
    default:
      return null;
  }
}
