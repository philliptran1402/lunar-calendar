import { julianDay } from '../time/julian.js';

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const CHI = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ',
  'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
] as const;

/** The zodiac animal of each of the 12 branches — for "year of the ..." in the UI. */
export const CON_GIAP = [
  'Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn',
  'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn',
] as const;

const pick = <T,>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length]!;

export const canChiYear = (lunarYear: number): string =>
  `${pick(CAN, lunarYear + 6)} ${pick(CHI, lunarYear + 8)}`;

export const conGiapYear = (lunarYear: number): string => pick(CON_GIAP, lunarYear + 8);

/** Zodiac index 0..11 (0 = Tý / Rat), so the UI can translate the animal name. */
export const conGiapIndex = (lunarYear: number): number => ((lunarYear + 8) % 12 + 12) % 12;

/** Day of the week as 0..6 (0 = Sunday). */
export const weekdayIndexOf = (dd: number, mm: number, yy: number): number =>
  Math.floor(julianDay(yy, mm, dd) + 1.5) % 7;

export const canChiMonth = (lunarMonth: number, lunarYear: number): string =>
  `${pick(CAN, lunarYear * 12 + lunarMonth + 3)} ${pick(CHI, lunarMonth + 1)}`;

export const canChiDay = (jd: number): string => `${pick(CAN, jd + 9)} ${pick(CHI, jd + 1)}`;

/** The branch of the day (0..11) — the basis for lucky hours and the day star. */
export const chiIndexOfDay = (jd: number): number => (jd + 1) % 12;

/**
 * The 12 traditional hours (each two clock hours). This is the classical
 * lucky-hour table, looked up by the branch of the day:
 * '1' = auspicious, '0' = inauspicious.
 */
const GIO_HOANG_DAO = [
  '110100101100', // Tý, Ngọ
  '001101001011', // Sửu, Mùi
  '110011010010', // Dần, Thân
  '101100110100', // Mão, Dậu
  '001011001101', // Thìn, Tuất
  '010010110011', // Tỵ, Hợi
] as const;

export interface LuckyHour {
  /** Name of the hour's branch, e.g. "Tý" */
  chi: string;
  /** The clock range it covers, e.g. "23:00 – 00:59" */
  range: string;
  auspicious: boolean;
}

/** The lucky hours of a day, derived from the day's branch. */
export function luckyHours(jd: number): LuckyHour[] {
  const row = GIO_HOANG_DAO[chiIndexOfDay(jd) % 6]!;
  return CHI.map((chi, i) => {
    const startHour = (i * 2 + 23) % 24;
    const endHour = (startHour + 1) % 24;
    return {
      chi,
      range: `${String(startHour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:59`,
      auspicious: row[i] === '1',
    };
  });
}

/** The stem-branch of the day's first hour (the hour of Tý). */
export const canChiHour = (jd: number): string => `${pick(CAN, (jd - 1) * 2)} Tý`;

/**
 * The 12 day stars, cycling by lunar month — the basis of "auspicious /
 * inauspicious day". Note: this is TRADITIONAL CULTURAL KNOWLEDGE, offered
 * for reference. It is not advice and not a prediction.
 */
const TRUC_THAN = [
  'Thanh Long', 'Minh Đường', 'Thiên Hình', 'Chu Tước', 'Kim Quỹ', 'Bảo Quang',
  'Bạch Hổ', 'Ngọc Đường', 'Thiên Lao', 'Nguyên Vũ', 'Tư Mệnh', 'Câu Trận',
] as const;
export const TRUC_THAN_LIST = TRUC_THAN;
const GOOD_OFFSETS = new Set([0, 1, 4, 5, 7, 10]);
/** Which branch Thanh Long occupies, by month pair 1&7, 2&8, ... */
const START_CHI_BY_MONTH = [0, 2, 4, 6, 8, 10];

export interface DayQuality {
  /** Day-star index 0..11, so the UI can translate it */
  starIndex: number;
  /** Name of the day star on duty */
  star: string;
  /** true = auspicious, false = inauspicious */
  auspicious: boolean;
}

export function dayQuality(jd: number, lunarMonth: number): DayQuality {
  const start = START_CHI_BY_MONTH[(lunarMonth - 1) % 6]!;
  const offset = (chiIndexOfDay(jd) - start + 12) % 12;
  return { starIndex: offset, star: TRUC_THAN[offset]!, auspicious: GOOD_OFFSETS.has(offset) };
}

/** Weekday names in Vietnamese (0 = Sunday). */
export const WEEKDAY_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const;

export function weekdayOf(dd: number, mm: number, yy: number): string {
  return WEEKDAY_VI[weekdayIndexOf(dd, mm, yy)]!;
}
