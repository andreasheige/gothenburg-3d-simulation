import { useGame } from '@/state/store';
import { PORTALS } from '@/domain/portals';

// Fast-travel overlay (toggled with T). Lists every portal destination as a
// clickable card; picking one teleports the player and closes the menu.
export function TravelMenu(): React.JSX.Element | null {
  const open = useGame((s) => s.travelOpen);
  const teleport = useGame((s) => s.teleport);
  const closeTravel = useGame((s) => s.closeTravel);
  if (!open) return null;

  return (
    <div className="travel" role="dialog" aria-label="Snabbresa">
      <div className="travel-card">
        <div className="travel-head">
          <span>🌀 Snabbresa</span>
          <button className="travel-close" onClick={closeTravel} aria-label="Stäng">
            ✕
          </button>
        </div>
        <div className="travel-grid">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              className="travel-item"
              style={{ borderLeftColor: p.color }}
              onClick={() => teleport(p.x, p.z, p.name)}
            >
              <span className="travel-name">{p.name}</span>
              <span className="travel-hint">{p.hint}</span>
            </button>
          ))}
        </div>
        <div className="travel-foot">Klicka på ett mål · T eller Esc för att stänga</div>
      </div>
    </div>
  );
}
