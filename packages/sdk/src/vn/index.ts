import {
  buildCycle,
  clearCalendarCache,
  dayNumberToLunar,
  lunarToDayNumber,
  type LunarDate,
  type TimeZoneResolver,
} from '../calendar/lunisolar.js';
import { dayNumberToCivilDate, julianDay, localMidnightDayNumber, asUT } from '../time/julian.js';

/**
 * The timezone the Vietnamese calendar is computed on: the 105°E meridian,
 * i.e. UTC+7.
 *
 * Legal basis: Decree 121/CP (8 Aug 1967, in force 1 Jan 1968), Article 3 — the
 * lunar calendar must be computed on Vietnam's official time; reaffirmed by
 * Decision 134/2002/QD-TTg. This is precisely why Vietnam sometimes celebrates
 * Tết a day apart from China (UTC+8).
 */
export const VN_TIMEZONE = 7;

/** For reconstructing another region's calendar, or a historical variant. */
export const CHINA_TIMEZONE = 8;

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

/** Solar date → lunar date. */
export function solarToLunar(
  day: number,
  month: number,
  year: number,
  tz: TimeZoneResolver = VN_TIMEZONE,
): LunarDate {
  const dayNumber = localMidnightDayNumber(asUT(julianDay(year, month, day)), 0);
  return dayNumberToLunar(dayNumber, tz, year);
}

/** Lunar date → solar date. Returns null when that date does not exist. */
export function lunarToSolar(
  day: number,
  month: number,
  year: number,
  leap = false,
  tz: TimeZoneResolver = VN_TIMEZONE,
): SolarDate | null {
  const dn = lunarToDayNumber(day, month, year, leap, tz);
  if (dn === null) return null;
  const { year: y, month: m, day: d } = dayNumberToCivilDate(dn);
  return { day: d, month: m, year: y };
}

/** Which month is doubled in a leap year, or null if the year is not leap. */
export function leapMonthOf(year: number, tz: TimeZoneResolver = VN_TIMEZONE): number | null {
  for (const m of [...buildCycle(year, tz), ...buildCycle(year + 1, tz)]) {
    if (m.leap && m.year === year) return m.month;
  }
  return null;
}

/** Length of a lunar month: 29 (short) or 30 (long) days. */
export function lunarMonthLength(
  month: number,
  year: number,
  leap = false,
  tz: TimeZoneResolver = VN_TIMEZONE,
): number {
  const all = [...buildCycle(year, tz), ...buildCycle(year + 1, tz)];
  return all.find((m) => m.month === month && m.year === year && m.leap === leap)?.length ?? 0;
}

export { clearCalendarCache };
export type { LunarDate, TimeZoneResolver };

export * from './canchi.js';
export * from './holiday.js';
export * from './solar-term.js';
export * from './almanac.js';
