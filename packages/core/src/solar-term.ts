import { getSolarTermIndex } from './astronomy.js';
import { VN_TIMEZONE } from './lunar.js';

/**
 * 24 tiet khi, bat dau tu Xuan phan (kinh do Mat Troi 0 do).
 * Tiet khi la LICH MAT TROI — quyet dinh mua vu, khong phai lich mat trang.
 */
export const SOLAR_TERMS = [
  'Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng',
  'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết',
  'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập',
] as const;

export type SolarTerm = (typeof SOLAR_TERMS)[number];

/** Chi so tiet khi 0..23 (0 = Xuan phan) — dung de dich sang ngon ngu khac. */
export function solarTermIndexOf(jd: number, timeZone: number = VN_TIMEZONE): number {
  return getSolarTermIndex(jd + 1, timeZone);
}

/** Tiet khi cua ngay (theo jd). */
export function solarTermOf(jd: number, timeZone: number = VN_TIMEZONE): SolarTerm {
  return SOLAR_TERMS[solarTermIndexOf(jd, timeZone)]!;
}

/** Ngay nay co PHAI ngay bat dau mot tiet khi moi khong. */
export function isSolarTermStart(jd: number, timeZone: number = VN_TIMEZONE): boolean {
  return getSolarTermIndex(jd + 1, timeZone) !== getSolarTermIndex(jd, timeZone);
}
