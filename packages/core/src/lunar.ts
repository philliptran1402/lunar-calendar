import { getNewMoonDay, getSunLongitude } from './astronomy.js';
import { int, jdFromDate, jdToDate } from './julian.js';

/** Mui gio Viet Nam. Day la diem KHAC BIET voi lich am Trung Quoc (UTC+8):
 *  cung mot ky trang moi, lech mui gio co the day sang ngay khac
 *  => thang nhuan va ngay Tet lech nhau. KHONG dung lib lich am TQ cho VN. */
export const VN_TIMEZONE = 7.0;

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  /** true = thang nhuan */
  leap: boolean;
  /** Julian day number cua ngay duong tuong ung */
  jd: number;
}

/** Ngay bat dau thang 11 am lich (thang chua Dong chi) cua nam duong yy. */
function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = int(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

/**
 * Vi tri thang nhuan trong nam nhuan.
 * Nguyen tac: thang am lich dau tien KHONG chua trung khi la thang nhuan.
 */
function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = int((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Duong lich -> am lich. */
export function solarToLunar(
  dd: number,
  mm: number,
  yy: number,
  timeZone: number = VN_TIMEZONE,
): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = int((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }

  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = int((monthStart - a11) / 29);
  let leap = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) leap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap, jd: dayNumber };
}

/** Am lich -> duong lich. Tra ve null neu thang nhuan do khong ton tai. */
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  leap = false,
  timeZone: number = VN_TIMEZONE,
): { day: number; month: number; year: number } | null {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }

  let off = lunarMonth - 11;
  if (off < 0) off += 12;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && lunarMonth !== leapMonth) return null; // nam nay khong nhuan thang do
    if (leap || off >= leapOff) off += 1;
  } else if (leap) {
    return null; // nam khong nhuan
  }

  const k = int(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  const monthStart = getNewMoonDay(k + off, timeZone);
  const [day, month, year] = jdToDate(monthStart + lunarDay - 1);
  return { day, month, year };
}

/** So ngay cua mot thang am lich (29 = thang thieu, 30 = thang du). */
export function lunarMonthLength(
  lunarMonth: number,
  lunarYear: number,
  leap = false,
  timeZone: number = VN_TIMEZONE,
): number {
  const start = lunarToSolar(1, lunarMonth, lunarYear, leap, timeZone);
  if (!start) return 0;
  const startJd = jdFromDate(start.day, start.month, start.year);
  const d30 = jdToDate(startJd + 29);
  const l30 = solarToLunar(d30[0], d30[1], d30[2], timeZone);
  return l30.day === 30 ? 30 : 29;
}

/** Nam am lich co nhuan khong, va nhuan thang may. */
export function getLeapMonth(lunarYear: number, timeZone: number = VN_TIMEZONE): number | null {
  const a11 = getLunarMonth11(lunarYear - 1, timeZone);
  const b11 = getLunarMonth11(lunarYear, timeZone);
  if (b11 - a11 <= 365) return null;
  const leapOff = getLeapMonthOffset(a11, timeZone);
  let leapMonth = leapOff - 2;
  if (leapMonth < 0) leapMonth += 12;
  return leapMonth;
}
