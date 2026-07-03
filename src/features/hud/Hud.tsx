import { useGame } from '@/state/store';
import { useWeather } from '@/state/weather';
import { ITEMS } from '@/core/config/items';
import { resolveInterior, THEMES, currentConcert, isConcertVenue } from '@/domain/interiors';
import { Minimap } from '@/features/hud/Minimap';
import { Compass } from '@/features/hud/Compass';
import { TravelMenu } from '@/features/hud/TravelMenu';
import { currentService } from '@/domain/transit/schedule';
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
  const street = useGame((s) => s.street);
  const guide = useGame((s) => s.guide);
  const debug = useGame((s) => s.debug);
  const wIcon = useWeather((s) => s.icon);
  const wLabel = useWeather((s) => s.label);
  const wTemp = useWeather((s) => s.tempC);
  const wOnline = useWeather((s) => s.online);

  const stars = Math.round(wanted);
  const interiorDef = scene === 'interior' ? resolveInterior(interiorId) : null;
  const place = interiorDef ? interiorDef.name : district;
  let interiorInfo: string | null = null;
  if (interiorDef) {
    if (interiorDef.kind === 'nightlife') {
      const v = interiorDef.venue;
      interiorInfo = isConcertVenue(v) ? currentConcert(v.id).music : THEMES[v.theme].music;
    } else if (interiorDef.kind === 'fishmarket') {
      interiorInfo = '🐟 Fiskhallen — färsk fisk & skaldjur';
    } else {
      interiorInfo = '🎢 Nöjespark — åk attraktioner';
    }
  }
  const trafik = currentService('3');

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
          {scene === 'interior' && interiorInfo && (
            <div className="row">
              <span className="lbl">Scen</span>
              <span className="val">{interiorInfo}</span>
            </div>
          )}
          {scene !== 'interior' && street && (
            <div className="row">
              <span className="lbl">Gata</span>
              <span className="val">{street}</span>
            </div>
          )}
          {scene !== 'interior' && guide && (
            <div className="row">
              <span className="lbl">Landmärke</span>
              <span className="val">
                {guide.name} · {guide.dist} m
              </span>
            </div>
          )}
          <div className="row">
            <span className="lbl">Klocka</span>
            <span className="val">{clock(dayT)}</span>
          </div>
          <div className="row">
            <span className="lbl">Väder</span>
            <span className="val">
              {wIcon} {wTemp}°C · {wLabel}
              {!wOnline && <span className="clean"> (offline)</span>}
            </span>
          </div>
          <div className="row">
            <span className="lbl">Trafik</span>
            <span className="val">
              🚋 {trafik.band} · var {trafik.headwayMin} min
            </span>
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

      {debug && <div className="debug-badge">🐛 DEBUG · kollision</div>}

      {scene !== 'interior' && (
        <>
          <Compass />
          <Minimap />
          <TravelMenu />
        </>
      )}

      <div className="help">
        <div>
          <b>WASD</b> gå &nbsp; <b>Shift</b> spring &nbsp; <b>Mus</b> dra för att vrida &nbsp; <b>Hjul</b> zoom
        </div>
        <div>
          <b>Q/R</b> vrid &nbsp; <b>Z/X</b> luta &nbsp; <b>E</b> interagera &nbsp; <b>F</b> släpp mat &nbsp; <b>M</b> karta &nbsp; <b>T</b> resa &nbsp; <b>`</b> debug
        </div>
      </div>
    </>
  );
}
