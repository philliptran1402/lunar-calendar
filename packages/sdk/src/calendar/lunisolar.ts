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
 * Quy tac lich am-duong, viet THANG theo dinh nghia phap ly (QD 121/CP 1967):
 *  1. Thang bat dau vao NGAY (gio dia phuong) chua thoi diem Soc (trang moi).
 *  2. Thang 11 la thang chua Dong chi (kinh do Mat Troi = 270 do).
 *  3. Nam nhuan = chu ky tu thang 11 den thang 11 co 13 thang; thang nhuan la
 *     thang DAU TIEN khong chua trung khi (kinh do Mat Troi chia het cho 30).
 *  4. Tinh theo kinh tuyen 105 do Dong = UTC+7 (Viet Nam).
 *
 * Khac ban pho bien: khong dung meo "cung 30 do luc nua dem" ma tinh THOI DIEM
 * that cua trung khi — ro rang, kiem chung duoc, va dung o ca cac ca sat bien.
 */

/** Mui gio co the thay doi theo thoi gian (lich su Viet Nam tung la UTC+8). */
export type TimeZoneResolver = number | ((jdUT: JdUT) => number);

const tzAt = (tz: TimeZoneResolver, jd: JdUT): number =>
  typeof tz === 'number' ? tz : tz(jd);

/* ------------------------------------------------------------------ cache */

const newMoonDayCache = new Map<string, number>();
const winterSolsticeCache = new Map<string, number>();

const cacheKey = (a: number, tz: TimeZoneResolver): string =>
  `${a}|${typeof tz === 'number' ? tz : 'fn'}`;

/**
 * Do BAT DINH cua thoi diem tinh duoc (giay), gom:
 *  - sai so cua chuoi Meeus ch.49 (~17s toi da)
 *  - bat dinh cua DeltaT: trong ky do duoc thi nho, cang xa cang lon
 *    (DeltaT tuong lai phu thuoc toc do quay cua Trai Dat — KHONG the biet truoc).
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
  /** So ngay lich dia phuong chua thoi diem soc */
  dayNumber: number;
  /** Khoang cach tu thoi diem soc den nua dem dia phuong gan nhat (giay) */
  marginSeconds: number;
  /** true = qua sat nua dem, ngay bat dau thang KHONG chac chan */
  uncertain: boolean;
}

/** Thong tin day du ve mot ky trang moi, ke ca do chac chan cua ngay. */
export function newMoonInfo(k: number, tz: TimeZoneResolver): NewMoonInfo {
  const jdUt = ttToUt(newMoonTT(k));
  const offset = tzAt(tz, jdUt);
  const local = jdUt + offset / 24 + 0.5;
  const frac = local - Math.floor(local); // 0 = dung nua dem
  const marginSeconds = Math.min(frac, 1 - frac) * 86400;
  return {
    k,
    dayNumber: Math.floor(local),
    marginSeconds,
    uncertain: marginSeconds < uncertaintySeconds(jdUt),
  };
}

/** So ngay lich (dia phuong) chua thoi diem trang moi thu k. */
export function newMoonDayNumber(k: number, tz: TimeZoneResolver): number {
  const key = cacheKey(k, tz);
  const hit = newMoonDayCache.get(key);
  if (hit !== undefined) return hit;
  const jdUt = ttToUt(newMoonTT(k));
  const day = localMidnightDayNumber(jdUt, tzAt(tz, jdUt));
  newMoonDayCache.set(key, day);
  return day;
}

/** So ngay lich chua Dong chi cua nam duong `year`. */
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

/** Ngay bat dau thang 11 am lich (thang chua Dong chi) cua nam duong `year`. */
export function month11StartDay(year: number, tz: TimeZoneResolver): number {
  const ws = winterSolsticeDayNumber(year, tz);
  let k = newMoonIndexNear(ws - 0.5);
  // Lui/tien cho den khi trang moi thu k la trang moi CUOI CUNG <= ngay Dong chi
  while (newMoonDayNumber(k, tz) > ws) k--;
  while (newMoonDayNumber(k + 1, tz) <= ws) k++;
  return newMoonDayNumber(k, tz);
}

/**
 * Thang duong lich co chua "trung khi" khong (kinh do Mat Troi chia het cho 30).
 * Kiem tra bang cach so cung 30 do tai dau va cuoi thang am: neu khac cung
 * thi trong thang co it nhat mot trung khi.
 */
function hasPrincipalTerm(startDay: number, nextStartDay: number, tz: TimeZoneResolver): boolean {
  const sector = (day: number): number => {
    const jd = dayNumberToJdUT(day, tzAt(tz, dayNumberToJdUT(day, 7)));
    // Kinh do luc 00:00 gio dia phuong cua ngay do
    const lon = sunApparentLongitude(asTT(jd + 69 / 86400));
    return Math.floor(lon / 30);
  };
  return sector(startDay) !== sector(nextStartDay);
}

export interface LunarMonth {
  /** So ngay lich dia phuong cua mung 1 */
  start: number;
  /** So thu tu thang 1..12 */
  month: number;
  leap: boolean;
  /** 29 (thieu) hoac 30 (du) */
  length: number;
  /** Nam am lich */
  year: number;
  /** Khoang cach tu thoi diem soc den nua dem (giay) */
  startMarginSeconds: number;
  /** true = ngay bat dau thang nay khong chac chan (soc qua sat nua dem) */
  uncertain: boolean;
}

const yearCache = new Map<string, LunarMonth[]>();

/**
 * Dung toan bo chu ky thang-11 -> thang-11 cho nam duong `year`,
 * tra ve danh sach thang co danh so va danh dau nhuan.
 */
export function buildCycle(year: number, tz: TimeZoneResolver): LunarMonth[] {
  const key = cacheKey(year, tz);
  const hit = yearCache.get(key);
  if (hit) return hit;

  const a11 = month11StartDay(year - 1, tz); // thang 11 cua nam truoc
  const b11 = month11StartDay(year, tz); // thang 11 cua nam nay

  // Lay moc trang moi cua a11 roi liet ke cac thang trong chu ky
  let k = newMoonIndexNear(a11 - 0.5);
  while (newMoonDayNumber(k, tz) !== a11) k += newMoonDayNumber(k, tz) < a11 ? 1 : -1;

  const starts: number[] = [];
  for (let i = 0; ; i++) {
    const d = newMoonDayNumber(k + i, tz);
    starts.push(d);
    if (d >= b11) break;
  }
  const count = starts.length - 1; // so thang trong chu ky (12 hoac 13)
  const isLeapYear = count === 13;

  // Tim thang nhuan: thang DAU TIEN khong co trung khi (bo qua chinh thang 11)
  let leapIndex = -1;
  if (isLeapYear) {
    for (let i = 1; i < count; i++) {
      if (!hasPrincipalTerm(starts[i]!, starts[i + 1]!, tz)) {
        leapIndex = i;
        break;
      }
    }
    if (leapIndex === -1) leapIndex = 1; // phong ho, gan nhu khong xay ra
  }

  const months: LunarMonth[] = [];
  let num = 11; // thang dau chu ky la thang 11
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
   * true = thoi diem soc mo dau thang nay qua sat nua dem, nen ngay am lich
   * co the lech 1 ngay tuy mo hinh DeltaT. Cac ban cai dat khac nhau se
   * BAT DONG o dung cac ngay nay. Trung thuc hon la im lang doan bua.
   */
  uncertain: boolean;
}

/** Ngay duong (so ngay lich dia phuong) -> ngay am. */
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
  // Roi ngoai chu ky da dung (bien nam) -> thu chu ky ke
  const next = buildCycle(solarYear + 1, tz);
  for (const m of next) {
    if (dayNumber >= m.start && dayNumber < m.start + m.length) {
      return { day: dayNumber - m.start + 1, month: m.month, year: m.year, leap: m.leap, uncertain: m.uncertain };
    }
  }
  throw new Error(`Khong dinh vi duoc ngay ${dayNumber} trong chu ky`);
}

/** Ngay am -> so ngay lich dia phuong. Tra null neu thang nhuan do khong ton tai. */
export function lunarToDayNumber(
  day: number,
  month: number,
  year: number,
  leap: boolean,
  tz: TimeZoneResolver,
): number | null {
  // buildCycle(Y) chua thang 11,12 cua nam (Y-1) va thang 1..11 cua nam Y
  // => hop cua hai chu ky Y va Y+1 phu du thang 1..12 cua nam am Y.
  const all = [...buildCycle(year, tz), ...buildCycle(year + 1, tz)];
  const m = all.find((x) => x.month === month && x.year === year && x.leap === leap);
  if (!m) return null;
  if (day < 1 || day > m.length) return null;
  return m.start + day - 1;
}

/** Xoa cache (dung khi doi nguon DeltaT hoac mui gio). */
export function clearCalendarCache(): void {
  newMoonDayCache.clear();
  winterSolsticeCache.clear();
  yearCache.clear();
}

export { wrap180 };
