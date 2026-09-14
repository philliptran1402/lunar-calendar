/**
 * Time scales. The crux of getting this right: TT and UT must never be mixed.
 *   TT (Terrestrial Time)  — the scale astronomical formulae are expressed in
 *   UT (Universal Time)    — the scale civil calendars are kept in
 * They differ by ΔT (~70 s today, ~1570 s in the year 1000). Conflating the two
 * is a SYSTEMATIC source of off-by-one-day errors.
 */

/** A Julian Day on the TT scale — for astronomical computation only. */
export type JdTT = number & { readonly __scale: 'TT' };
/** A Julian Day on the UT scale — used to derive local dates and times. */
export type JdUT = number & { readonly __scale: 'UT' };

export const asTT = (jd: number): JdTT => jd as JdTT;
export const asUT = (jd: number): JdUT => jd as JdUT;

export const J2000 = 2451545.0;
/** Julian centuries since J2000, the argument of every series below. */
export const centuriesFromJ2000 = (jdTT: JdTT): number => (jdTT - J2000) / 36525;

const floor = Math.floor;

/**
 * Calendar date (Gregorian/Julian) → Julian Day.
 * `day` may carry a fraction to express the time of day.
 */
export function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  // Julian → Gregorian changeover: 15 Oct 1582
  const gregorian = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  const b = gregorian ? 2 - floor(y / 100) + floor(floor(y / 100) / 4) : 0;
  return floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

export interface CivilDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Julian Day → calendar date with time of day. */
export function fromJulianDay(jd: number): CivilDateTime {
  const z = floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - floor(alpha / 4);
  }
  const b = a + 1524;
  const c = floor((b - 122.1) / 365.25);
  const d = floor(365.25 * c);
  const e = floor((b - d) / 30.6001);

  const dayFrac = b - d - floor(30.6001 * e) + f;
  const day = floor(dayFrac);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  let rest = (dayFrac - day) * 24;
  const hour = floor(rest);
  rest = (rest - hour) * 60;
  const minute = floor(rest);
  const second = Math.round((rest - minute) * 60);
  return second === 60
    ? { year, month, day, hour, minute: minute + 1, second: 0 }
    : { year, month, day, hour, minute, second };
}

/**
 * The integer day number containing instant `jdUT` in timezone `tzHours`.
 *
 * This single function decides WHICH DAY an event falls on — the heart of a
 * lunisolar calendar, and where a one-second error becomes a one-day error.
 */
export function localMidnightDayNumber(jdUT: JdUT, tzHours: number): number {
  return floor(jdUT + 0.5 + tzHours / 24);
}

/** The Julian Day at 00:00 local time of a given day number. */
export const dayNumberToJdUT = (dayNumber: number, tzHours: number): JdUT =>
  asUT(dayNumber - 0.5 - tzHours / 24);

/**
 * Day number → calendar date.
 *
 * The exact inverse of `localMidnightDayNumber(jd, 0)`: since
 * `dayNumber = floor(jd + 0.5)`, midnight sits at `dayNumber - 0.5`.
 * (Getting this sign wrong produces a one-day shift that is very hard to spot.)
 */
export const dayNumberToCivilDate = (dayNumber: number): { year: number; month: number; day: number } => {
  const { year, month, day } = fromJulianDay(dayNumber - 0.5);
  return { year, month, day };
};
