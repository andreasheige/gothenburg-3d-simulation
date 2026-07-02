// Synthetic but realistic Gothenburg tram timetable. Headways (minutes between
// departures) vary by time-of-day and weekday — rush hours are denser, nights
// sparse. Drives how many trams run on each line and the live next-departure
// readout shown when boarding.

import { realDayT, realWeekday } from '@/core/systems/time';

// Base daytime headway per line ref (minutes). Trunk lines run tighter.
const BASE_HEADWAY: Record<string, number> = {
  '1': 10,
  '2': 8,
  '3': 6,
  '4': 6,
  '5': 8,
  '6': 6,
  '7': 10,
  '8': 8,
  '9': 10,
  '10': 12,
  '11': 10,
  '13': 12,
};
const DEFAULT_HEADWAY = 12;

interface Band {
  readonly mult: number;
  readonly label: string;
}

// Headway multiplier + service-band label by hour and weekday. mult < 1 means a
// denser (rush-hour) service; mult > 1 means sparser.
function bandFor(hour: number, weekend: boolean): Band {
  if (hour < 5) return { mult: 3.0, label: 'Nattrafik' };
  if (hour < 6) return { mult: 2.0, label: 'Tidig morgon' };
  if (!weekend && hour >= 7 && hour < 9) return { mult: 0.7, label: 'Rusningstrafik' };
  if (!weekend && hour >= 15 && hour < 18) return { mult: 0.7, label: 'Rusningstrafik' };
  if (hour >= 9 && hour < 15) return { mult: 1.0, label: 'Dagtrafik' };
  if (hour >= 18 && hour < 21) return { mult: 1.3, label: 'Kvällstrafik' };
  if (hour >= 21) return { mult: 1.8, label: 'Sen kväll' };
  return { mult: 1.0, label: 'Dagtrafik' };
}

export interface Service {
  /** Rounded minutes between departures right now. */
  readonly headwayMin: number;
  /** Service-band label (Swedish). */
  readonly band: string;
  /** Whole minutes until the next scheduled departure. */
  readonly nextMin: number;
}

export function serviceFor(
  ref: string,
  hour: number,
  weekend: boolean,
  minuteOfDay: number,
): Service {
  const base = BASE_HEADWAY[ref] ?? DEFAULT_HEADWAY;
  const b = bandFor(hour, weekend);
  const headwayMin = Math.max(3, Math.round(base * b.mult));
  const nextMin = headwayMin - (minuteOfDay % headwayMin);
  return { headwayMin, band: b.label, nextMin };
}

/** Number of vehicles a line should run now — more at rush, fewer at night. */
export function tramCountFor(ref: string, hour: number, weekend: boolean): number {
  const trunk = (BASE_HEADWAY[ref] ?? DEFAULT_HEADWAY) <= 6;
  const baseCount = trunk ? 4 : 3;
  const m = bandFor(hour, weekend).mult;
  return Math.max(1, Math.min(6, Math.round(baseCount / m)));
}

/** Live service for a line, sampled from the real Gothenburg clock. */
export function currentService(ref: string): Service {
  const dt = realDayT();
  return serviceFor(ref, dt * 24, isWeekendNow(), Math.floor(dt * 1440));
}

export function isWeekendNow(): boolean {
  const d = realWeekday();
  return d === 0 || d === 6;
}
