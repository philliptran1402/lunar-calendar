import { newMoonIndexNear, newMoonTT } from '../astro/moon.js';
import { solarLongitudeTime, wrap180 } from '../astro/search.js';
import { sunApparentLongitude } from '../astro/sun.js';
import { ttToUt } from '../time/deltat.js';
import {
  asTT,
  dayNumberToJdUT,
  julianDay,
  localMidnightDayNumber,
  type JdUT,
} from '../time/julian.js';

/**
 * The lunisolar rules, written out exactly as the law defines them
 * (Decree 121/CP, 1967):
 *
 *  1. A month begins on the DAY (in local time) containing the conjunction.
 *  2. Month 11 is the month containing the winter solstice (solar longitude 270°).
 *  3. A leap year is a solstice-to-solstice cycle holding 13 months; the leap
 *     month is the FIRST one containing no principal term (a solar longitude
 *     that is a multiple of 30°).
 *  4. Computed on the 105°E meridian = UTC+7 for Vietnam.
 *
 * Unlike the common port, this does not rely on the "30° sector at midnight"
 * shortcut — it locates the actual instant of each principal term, which is
 * clearer, verifiable, and correct in the borderline cases.
 */

/** The timezone may vary with time — Vietnam was on UTC+8 before 1968. */
export type TimeZoneResolver = number | ((jdUT: JdUT) => number);

const tzAt = (tz: TimeZoneResolver, jd: JdUT): number =>
  typeof tz === 'number' ? tz : tz(jd);

/* ------------------------------------------------------------------ cache */

const newMoonDayCache = new Map<string, number>();
const winterSolsticeCache = new Map<string, number>();

const cacheKey = (a: number, tz: TimeZoneResolver): string =>
  `${a}|${typeof tz === 'number' ? tz : 'fn'}`;

/**
 * How UNCERTAIN a computed instant is, in seconds. Two contributions:
 *  - the error of the Meeus ch. 49 series (~17 s at worst)
 *  - the uncertainty in ΔT: small inside the measured era, growing with
 *    distance from it. Future ΔT depends on the Earth's rotation and is
 *    genuinely UNKNOWABLE.
 */
export function uncertaintySeconds(jdUT: number): number {
  const year = 2000 + (jdUT - 2451545) / 365.25;
  const METHOD = 20;
  if (year >= 1980 && year <= 2026) return METHOD;
  if (year > 2026) return METHOD + (year - 2026) * 0.6; // DeltaT tuong lai la du doan
  if (year >= 1600) return METHOD + (1980 - year) * 0.15;
  return METHOD + (1980 - year) * 0.5;
}

export interface NewMoonInfo {
  k: number;
  /** The local day number containing the conjunction */
  dayNumber: number;
  /** Distance from the conjunction to the nearest local midnight, in seconds */
  marginSeconds: number;
  /** true when the conjunction is so near midnight the month's start is uncertain */
  uncertain: boolean;
}

/** Full detail about one lunation, including how certain its date is. */
export function newMoonInfo(k: number, tz: TimeZoneResolver): NewMoonInfo {
  const jdUt = ttToUt(newMoonTT(k));
  const offset = tzAt(tz, jdUt);
  const local = jdUt + offset / 24 + 0.5;
  const frac = local - Math.floor(local); // 0 = exactly midnight
  const marginSeconds = Math.min(frac, 1 - frac) * 86400;
  return {
    k,
    dayNumber: Math.floor(local),
    marginSeconds,
    uncertain: marginSeconds < uncertaintySeconds(jdUt),
  };
}

/** The local day number containing the k-th new moon. */
export function newMoonDayNumber(k: number, tz: TimeZoneResolver): number {
  const key = cacheKey(k, tz);
  const hit = newMoonDayCache.get(key);
  if (hit !== undefined) return hit;
  const jdUt = ttToUt(newMoonTT(k));
  const day = localMidnightDayNumber(jdUt, tzAt(tz, jdUt));
  newMoonDayCache.set(key, day);
  return day;
}

/** The local day number containing the winter solstice of solar year `year`. */
export function winterSolsticeDayNumber(year: number, tz: TimeZoneResolver): number {
  const key = cacheKey(year, tz);
  const hit = winterSolsticeCache.get(key);
  if (hit !== undefined) return hit;
  const near = julianDay(year, 12, 21);
  const jdUt = ttToUt(solarLongitudeTime(near, 270));
  const day = localMidnightDayNumber(jdUt, tzAt(tz, jdUt));
  winterSolsticeCache.set(key, day);
  return day;
}

/** Start of lunar month 11 — the month containing the solstice of `year`. */
export function month11StartDay(year: number, tz: TimeZoneResolver): number {
  const ws = winterSolsticeDayNumber(year, tz);
  let k = newMoonIndexNear(ws - 0.5);
  // Walk k until it is the LAST new moon on or before the solstice day
  while (newMoonDayNumber(k, tz) > ws) k--;
  while (newMoonDayNumber(k + 1, tz) <= ws) k++;
  return newMoonDayNumber(k, tz);
}

/**
 * Does this lunar month contain a principal term (a solar longitude that is a
 * multiple of 30°)? Compare the 30° sector at the month's first and last day:
 * if they differ, at least one principal term falls inside.
 */
function hasPrincipalTerm(startDay: number, nextStartDay: number, tz: TimeZoneResolver): boolean {
  const sector = (day: number): number => {
    const jd = dayNumberToJdUT(day, tzAt(tz, dayNumberToJdUT(day, 7)));
    // The solar longitude at 00:00 local time on that day
    const lon = sunApparentLongitude(asTT(jd + 69 / 86400));
    return Math.floor(lon / 30);
  };
  return sector(startDay) !== sector(nextStartDay);
}

export interface LunarMonth {
  /** Local day number of the first day of the month */
  start: number;
  /** Month number, 1..12 */
  month: number;
  leap: boolean;
  /** 29 (short) or 30 (long) */
  length: number;
  /** Lunar year */
  year: number;
  /** Distance from the conjunction to midnight, in seconds */
  startMarginSeconds: number;
  /** true when this month's start date is uncertain (conjunction near midnight) */
  uncertain: boolean;
}

const yearCache = new Map<string, LunarMonth[]>();

/**
 * Build the whole month-11 → month-11 cycle for solar year `year`, returning
 * the months with their numbers and leap flags assigned.
 */
export function buildCycle(year: number, tz: TimeZoneResolver): LunarMonth[] {
  const key = cacheKey(year, tz);
  const hit = yearCache.get(key);
  if (hit) return hit;

  const a11 = month11StartDay(year - 1, tz); // month 11 of the previous year
  const b11 = month11StartDay(year, tz); // month 11 of this year

  // Anchor on the lunation of a11, then enumerate the months of the cycle
  let k = newMoonIndexNear(a11 - 0.5);
  while (newMoonDayNumber(k, tz) !== a11) k += newMoonDayNumber(k, tz) < a11 ? 1 : -1;

  const starts: number[] = [];
  for (let i = 0; ; i++) {
    const d = newMoonDayNumber(k + i, tz);
    starts.push(d);
    if (d >= b11) break;
  }
  const count = starts.length - 1; // months in the cycle: 12, or 13 if leap
  const isLeapYear = count === 13;

  // The leap month is the FIRST without a principal term (month 11 excluded)
  let leapIndex = -1;
  if (isLeapYear) {
    for (let i = 1; i < count; i++) {
      if (!hasPrincipalTerm(starts[i]!, starts[i + 1]!, tz)) {
        leapIndex = i;
        break;
      }
    }
    if (leapIndex === -1) leapIndex = 1; // defensive; should not happen
  }

  const months: LunarMonth[] = [];
  let num = 11; // the cycle opens with month 11
  let lunarYear = year - 1;
  for (let i = 0; i < count; i++) {
    const leap = i === leapIndex;
    if (!leap) {
      if (i > 0) {
        num += 1;
        if (num > 12) {
          num = 1;
          lunarYear += 1;
        }
      }
    }
    const info = newMoonInfo(k + i, tz);
    months.push({
      start: starts[i]!,
      month: num,
      leap,
      length: starts[i + 1]! - starts[i]!,
      year: lunarYear,
      startMarginSeconds: info.marginSeconds,
      uncertain: info.uncertain,
    });
  }
  yearCache.set(key, months);
  return months;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  /**
   * true when the conjunction opening this month lands so close to midnight
   * that the date can differ by one day depending on the ΔT model. Different
   * implementations disagree on exactly these days — saying so is more honest
   * than guessing silently.
   */
  uncertain: boolean;
}

/** Local day number → lunar date. */
export function dayNumberToLunar(dayNumber: number, tz: TimeZoneResolver, solarYear: number): LunarDate {
  let cycle = buildCycle(solarYear, tz);
  if (dayNumber < cycle[0]!.start) cycle = buildCycle(solarYear - 1, tz);
  else if (dayNumber >= cycle[cycle.length - 1]!.start + cycle[cycle.length - 1]!.length) {
    cycle = buildCycle(solarYear + 1, tz);
  }
  for (const m of cycle) {
    if (dayNumber >= m.start && dayNumber < m.start + m.length) {
      return { day: dayNumber - m.start + 1, month: m.month, year: m.year, leap: m.leap, uncertain: m.uncertain };
    }
  }
  // Outside the cycle we built (a year boundary) — try the next one
  const next = buildCycle(solarYear + 1, tz);
  for (const m of next) {
    if (dayNumber >= m.start && dayNumber < m.start + m.length) {
      return { day: dayNumber - m.start + 1, month: m.month, year: m.year, leap: m.leap, uncertain: m.uncertain };
    }
  }
  throw new Error(`Could not locate day ${dayNumber} in any cycle`);
}

/** Lunar date → local day number. Returns null if that leap month does not exist. */
export function lunarToDayNumber(
  day: number,
  month: number,
  year: number,
  leap: boolean,
  tz: TimeZoneResolver,
): number | null {
  // buildCycle(Y) holds months 11–12 of year Y-1 and months 1–11 of year Y,
  // so the union of cycles Y and Y+1 covers all of lunar year Y.
  const all = [...buildCycle(year, tz), ...buildCycle(year + 1, tz)];
  const m = all.find((x) => x.month === month && x.year === year && x.leap === leap);
  if (!m) return null;
  if (day < 1 || day > m.length) return null;
  return m.start + day - 1;
}

/** Clear the caches — call this after changing the ΔT source or timezone. */
export function clearCalendarCache(): void {
  newMoonDayCache.clear();
  winterSolsticeCache.clear();
  yearCache.clear();
}

export { wrap180 };
