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
 * Mui gio tinh lich cua Viet Nam: kinh tuyen 105 do Dong = UTC+7.
 * Can cu: Quyet dinh 121/CP (8/8/1967, hieu luc 1/1/1968), Dieu 3 — lich am
 * phai tinh theo gio chinh thuc cua Viet Nam. Tai khang dinh boi QD 134/2002/QD-TTg.
 * Day la khac biet tao ra cac nam Viet Nam an Tet lech Trung Quoc (UTC+8).
 */
export const VN_TIMEZONE = 7;

/** Mui gio lich su (neu muon tai dung lich "theo dong ho thoi do"). */
export const CHINA_TIMEZONE = 8;

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

/** Duong lich -> am lich. */
export function solarToLunar(
  day: number,
  month: number,
  year: number,
  tz: TimeZoneResolver = VN_TIMEZONE,
): LunarDate {
  const dayNumber = localMidnightDayNumber(asUT(julianDay(year, month, day)), 0);
  return dayNumberToLunar(dayNumber, tz, year);
}

/** Am lich -> duong lich. Tra null neu ngay do khong ton tai. */
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

/** Nam am lich nhuan thang may (null = khong nhuan). */
export function leapMonthOf(year: number, tz: TimeZoneResolver = VN_TIMEZONE): number | null {
  for (const m of [...buildCycle(year, tz), ...buildCycle(year + 1, tz)]) {
    if (m.leap && m.year === year) return m.month;
  }
  return null;
}

/** So ngay cua mot thang am lich (29 hoac 30). */
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
