import { sunApparentLongitude } from '../astro/sun.js';
import type { TimeZoneResolver } from '../calendar/lunisolar.js';
import { asTT, dayNumberToJdUT, julianDay, localMidnightDayNumber, asUT } from '../time/julian.js';
import { deltaTSeconds } from '../time/deltat.js';
import { VN_TIMEZONE } from './index.js';

export const SOLAR_TERMS = [
  'Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng',
  'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết',
  'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập',
] as const;
export type SolarTerm = (typeof SOLAR_TERMS)[number];

/** Cung 15 do cua kinh do BIEU KIEN luc 00:00 gio dia phuong. */
function sectorAtLocalMidnight(dayNumber: number, tz: TimeZoneResolver): number {
  // Mui gio co the la ham theo thoi gian -> uoc luong mot lan roi giai
  const offset = typeof tz === 'number' ? tz : tz(dayNumberToJdUT(dayNumber, 0));
  const jdUt = dayNumberToJdUT(dayNumber, offset);
  const jdTT = asTT(jdUt + deltaTSeconds(jdUt) / 86400);
  return Math.floor(sunApparentLongitude(jdTT) / 15);
}

const dayNumberOf = (d: number, m: number, y: number): number =>
  localMidnightDayNumber(asUT(julianDay(y, m, d)), 0);

/**
 * Tiet khi cua mot ngay duong lich.
 * Quy uoc lich Viet: ngay MA tiet khi bat dau mang ten tiet khi MOI,
 * nen phai lay cung o CUOI ngay (= nua dem ke tiep), khong phai dau ngay.
 */
export function solarTermIndexOf(day: number, month: number, year: number, tz: TimeZoneResolver = VN_TIMEZONE): number {
  return sectorAtLocalMidnight(dayNumberOf(day, month, year) + 1, tz);
}

export function solarTermOf(day: number, month: number, year: number, tz: TimeZoneResolver = VN_TIMEZONE): SolarTerm {
  return SOLAR_TERMS[solarTermIndexOf(day, month, year, tz)]!;
}

/** Ngay nay co phai ngay BAT DAU mot tiet khi moi khong. */
export function isSolarTermStart(day: number, month: number, year: number, tz: TimeZoneResolver = VN_TIMEZONE): boolean {
  const dn = dayNumberOf(day, month, year);
  return sectorAtLocalMidnight(dn + 1, tz) !== sectorAtLocalMidnight(dn, tz);
}
