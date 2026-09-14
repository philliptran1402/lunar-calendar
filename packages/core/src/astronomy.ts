import { int } from './julian.js';

const PI = Math.PI;

/**
 * Thoi diem trang moi thu k (tinh tu 1/1/1900), theo Jean Meeus.
 * Do chinh xac du cho lich dan dung (sai so vai giay).
 */
export function newMoon(k: number): number {
  const T = k / 1236.85; // the ky Julius tu 1900-01-00.5
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3; // di thuong Mat Troi
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3; // di thuong Mat Trang
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3; // doi so vi do

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) - 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) - 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) + 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));

  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;

  return Jd1 + C1 - deltat;
}

/** Kinh do Mat Troi (radian) tai thoi diem jdn. */
export function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - PI * 2 * int(L / (PI * 2));
  return L;
}

/** Cung hoang dao 30 do (0..11) — dung de xac dinh thang nhuan. */
export function getSunLongitude(dayNumber: number, timeZone: number): number {
  return int((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6);
}

/** Cung 15 do (0..23) — dung de xac dinh 24 tiet khi. */
export function getSolarTermIndex(dayNumber: number, timeZone: number): number {
  return int((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 12);
}

/** Ngay chua trang moi thu k (theo mui gio dia phuong). */
export function getNewMoonDay(k: number, timeZone: number): number {
  return int(newMoon(k) + 0.5 + timeZone / 24);
}
