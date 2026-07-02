import { create } from 'zustand';

// Live weather for central Gothenburg via Open-Meteo (free, no API key, CORS-
// friendly). Drives sky/sun/fog, rain particles and a HUD readout. Falls back to
// a calm clear day if the network is unavailable.

export interface WeatherState {
  loaded: boolean;
  online: boolean;
  /** Air temperature in °C. */
  tempC: number;
  /** Cloud cover 0..1. */
  cloud: number;
  /** Precipitation in mm (last hour). */
  precip: number;
  /** Wind speed in m/s. */
  windMs: number;
  /** WMO weather interpretation code. */
  code: number;
  isDay: boolean;
  rain: boolean;
  snow: boolean;
  /** Swedish condition label. */
  label: string;
  /** Emoji icon for the HUD. */
  icon: string;
  refresh: () => Promise<void>;
}

interface Condition {
  label: string;
  icon: string;
  rain: boolean;
  snow: boolean;
}

// WMO weather_code → Swedish label + icon. https://open-meteo.com/en/docs
function condition(code: number): Condition {
  if (code === 0) return { label: 'Klart', icon: '☀️', rain: false, snow: false };
  if (code === 1) return { label: 'Mest klart', icon: '🌤️', rain: false, snow: false };
  if (code === 2) return { label: 'Halvklart', icon: '⛅', rain: false, snow: false };
  if (code === 3) return { label: 'Mulet', icon: '☁️', rain: false, snow: false };
  if (code === 45 || code === 48) return { label: 'Dimma', icon: '🌫️', rain: false, snow: false };
  if (code >= 51 && code <= 57) return { label: 'Duggregn', icon: '🌦️', rain: true, snow: false };
  if (code >= 61 && code <= 67) return { label: 'Regn', icon: '🌧️', rain: true, snow: false };
  if (code >= 71 && code <= 77) return { label: 'Snö', icon: '🌨️', rain: false, snow: true };
  if (code >= 80 && code <= 82) return { label: 'Regnskurar', icon: '🌧️', rain: true, snow: false };
  if (code === 85 || code === 86) return { label: 'Snöbyar', icon: '🌨️', rain: false, snow: true };
  if (code >= 95) return { label: 'Åska', icon: '⛈️', rain: true, snow: false };
  return { label: 'Växlande', icon: '🌥️', rain: false, snow: false };
}

interface OpenMeteoCurrent {
  temperature_2m?: number;
  precipitation?: number;
  cloud_cover?: number;
  wind_speed_10m?: number;
  weather_code?: number;
  is_day?: number;
}

const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746' +
  '&current=temperature_2m,precipitation,cloud_cover,wind_speed_10m,weather_code,is_day' +
  '&wind_speed_unit=ms&timezone=Europe%2FStockholm';

export const useWeather = create<WeatherState>()((set) => ({
  loaded: false,
  online: false,
  tempC: 14,
  cloud: 0.2,
  precip: 0,
  windMs: 3,
  code: 1,
  isDay: true,
  rain: false,
  snow: false,
  label: 'Mest klart',
  icon: '🌤️',
  refresh: async () => {
    try {
      const res = await fetch(URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { current?: OpenMeteoCurrent };
      const c = data.current ?? {};
      const code = c.weather_code ?? 1;
      const cond = condition(code);
      set({
        loaded: true,
        online: true,
        tempC: Math.round(c.temperature_2m ?? 14),
        cloud: Math.max(0, Math.min(1, (c.cloud_cover ?? 20) / 100)),
        precip: c.precipitation ?? 0,
        windMs: c.wind_speed_10m ?? 3,
        code,
        isDay: (c.is_day ?? 1) === 1,
        ...cond,
      });
    } catch {
      // Offline / blocked: keep the calm defaults but mark as loaded.
      set({ loaded: true, online: false });
    }
  },
}));

let started = false;

/** Fetch weather now and refresh every 10 minutes. Safe to call more than once. */
export function startWeather(): void {
  if (started) return;
  started = true;
  void useWeather.getState().refresh();
  setInterval(() => void useWeather.getState().refresh(), 10 * 60 * 1000);
}
