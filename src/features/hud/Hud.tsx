import { useGame } from '@/state/store';
import { ITEMS } from '@/core/config/items';
import { VENUES } from '@/domain/venues';
import type { ItemId } from '@/core/types';

function clock(dayT: number): string {
  const h = Math.floor(dayT * 24) % 24;
  const m = Math.floor(((dayT * 24) % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function Hud(): React.JSX.Element {
  const wallet = useGame((s) => s.wallet);
  const score = useGame((s) => s.score);
  const wanted = useGame((s) => s.wanted);
  const inventory = useGame((s) => s.inventory);
  const district = useGame((s) => s.district);
  const dayT = useGame((s) => s.dayT);
  const nearby = useGame((s) => s.nearby);
  const toasts = useGame((s) => s.toasts);
  const scene = useGame((s) => s.scene);
  const riding = useGame((s) => s.riding);
  const interiorId = useGame((s) => s.interiorId);

  const stars = Math.round(wanted);
  const venue = interiorId ? VENUES.find((v) => v.id === interiorId) : undefined;
  const place = scene === 'interior' && venue ? venue.name : district;

  const invSlots = (Object.entries(inventory) as [ItemId, number | undefined][]).filter(
    ([, n]) => (n ?? 0) > 0,
  );

  return (
    <>
      <div className="hud">
        <div className="panel stats">
          <div className="title">🇸🇪 Göteborgs-simulatorn</div>
          <div className="row">
            <span className="lbl">Plats</span>
            <span className="val">{place}</span>
          </div>
          <div className="row">
            <span className="lbl">Klocka</span>
            <span className="val">{clock(dayT)}</span>
          </div>
          <div className="row">
            <span className="lbl">Plånbok</span>
            <span className="val">{wallet} kr</span>
          </div>
          <div className="row">
            <span className="lbl">Poäng</span>
            <span className="val">{score}</span>
          </div>
          <div className="row">
            <span className="lbl">Efterlyst</span>
            <span className="val">
              {stars > 0 ? (
                <span className="stars">
                  {'★'.repeat(stars)}
                  {'☆'.repeat(5 - stars)}
                </span>
              ) : (
                <span className="clean">Lugnt läge</span>
              )}
            </span>
          </div>
          {riding && (
            <div className="row">
              <span className="lbl">Åker</span>
              <span className="val">🚋 {riding}</span>
            </div>
          )}
        </div>

        <div className="inv">
          {invSlots.length === 0 && (
            <div className="slot" style={{ opacity: 0.4 }}>
              —
            </div>
          )}
          {invSlots.map(([id, n]) => {
            const it = ITEMS[id];
            return (
              <div className="slot" key={id} title={it.label}>
                <span>{it.icon}</span>
                <span className="cnt">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {nearby && (
        <div className="prompt">
          <kbd>E</kbd>
          {nearby.label}
        </div>
      )}

      <div className="toasts">
        {toasts.map((t) => (
          <div className={`toast ${t.kind}`} key={t.id}>
            {t.msg}
          </div>
        ))}
      </div>

      <div className="scene-badge">{scene === 'interior' ? 'Inomhus' : 'Göteborg'}</div>

      <div className="help">
        <div>
          <b>WASD</b> gå &nbsp; <b>Shift</b> spring &nbsp; <b>Q/R</b> rotera kamera
        </div>
        <div>
          <b>E</b> interagera &nbsp; <b>F</b> släpp mat (måsar)
        </div>
      </div>
    </>
  );
}
