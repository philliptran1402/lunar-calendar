import { sunApparentLongitude } from '../astro/sun.js';
import type { TimeZoneResolver } from '../calendar/lunisolar.js';
import { asTT, dayNumberToJdUT, julianDay, localMidnightDayNumber, asUT } from '../time/julian.js';
import { deltaTSeconds } from '../time/deltat.js';
import { VN_TIMEZONE } from './index.js';

/**
 * The 24 solar terms, starting at the vernal equinox (solar longitude 0°).
 * Solar terms belong to the SOLAR year — they track the seasons, not the Moon.
 */
export const SOLAR_TERMS = [
  'Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng',
  'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết',
  'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập',
] as const;
export type SolarTerm = (typeof SOLAR_TERMS)[number];

/** Which 15° sector the APPARENT solar longitude occupies at local midnight. */
function sectorAtLocalMidnight(dayNumber: number, tz: TimeZoneResolver): number {
  // The timezone may vary with time — resolve it from a first estimate
  const offset = typeof tz === 'number' ? tz : tz(dayNumberToJdUT(dayNumber, 0));
  const jdUt = dayNumberToJdUT(dayNumber, offset);
  const jdTT = asTT(jdUt + deltaTSeconds(jdUt) / 86400);
  return Math.floor(sunApparentLongitude(jdTT) / 15);
}

const dayNumberOf = (d: number, m: number, y: number): number =>
  localMidnightDayNumber(asUT(julianDay(y, m, d)), 0);

/**
 * The solar term a calendar day belongs to.
 *
 * Vietnamese convention: the day on which a term BEGINS carries the NEW term's
 * name, so the sector is read at the END of the day (the following midnight),
 * not at its start.
 */
export function solarTermIndexOf(day: number, month: number, year: number, tz: TimeZoneResolver = VN_TIMEZONE): number {
  return sectorAtLocalMidnight(dayNumberOf(day, month, year) + 1, tz);
}

export function solarTermOf(day: number, month: number, year: number, tz: TimeZoneResolver = VN_TIMEZONE): SolarTerm {
  return SOLAR_TERMS[solarTermIndexOf(day, month, year, tz)]!;
}

/** Whether a new solar term begins on this day. */
export function isSolarTermStart(day: number, month: number, year: number, tz: TimeZoneResolver = VN_TIMEZONE): boolean {
  const dn = dayNumberOf(day, month, year);
  return sectorAtLocalMidnight(dn + 1, tz) !== sectorAtLocalMidnight(dn, tz);
}
