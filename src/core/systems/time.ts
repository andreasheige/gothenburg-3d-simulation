// Real Gothenburg (Europe/Stockholm) wall-clock, expressed as a day fraction so
// the in-game day/night cycle matches reality including DST.

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Stockholm',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Current Stockholm local time as a fraction of the day in `[0, 1)`. */
export function realDayT(now: Date = new Date()): number {
  const parts = fmt.formatToParts(now);
  let h = 0;
  let m = 0;
  let s = 0;
  for (const p of parts) {
    if (p.type === 'hour') h = Number(p.value) % 24;
    else if (p.type === 'minute') m = Number(p.value);
    else if (p.type === 'second') s = Number(p.value);
  }
  return (h * 3600 + m * 60 + s) / 86400;
}

const dayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Stockholm',
  weekday: 'short',
});

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Stockholm weekday, 0 = Sunday … 6 = Saturday. */
export function realWeekday(now: Date = new Date()): number {
  return DAY_INDEX[dayFmt.format(now)] ?? now.getDay();
}
