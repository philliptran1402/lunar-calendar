import { jdFromDate } from './julian.js';

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const CHI = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ',
  'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
] as const;

/** Con giap tuong ung 12 chi — dung cho UI "nam con gi". */
export const CON_GIAP = [
  'Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn',
  'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn',
] as const;

const pick = <T,>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length]!;

export const canChiYear = (lunarYear: number): string =>
  `${pick(CAN, lunarYear + 6)} ${pick(CHI, lunarYear + 8)}`;

export const conGiapYear = (lunarYear: number): string => pick(CON_GIAP, lunarYear + 8);

/** Chi so con giap 0..11 (0 = Ty/Chuot) — de UI dich ten con vat. */
export const conGiapIndex = (lunarYear: number): number => ((lunarYear + 8) % 12 + 12) % 12;

/** Chi so thu trong tuan 0..6 (0 = Chu Nhat). */
export const weekdayIndexOf = (dd: number, mm: number, yy: number): number =>
  (jdFromDate(dd, mm, yy) + 1) % 7;

export const canChiMonth = (lunarMonth: number, lunarYear: number): string =>
  `${pick(CAN, lunarYear * 12 + lunarMonth + 3)} ${pick(CHI, lunarMonth + 1)}`;

export const canChiDay = (jd: number): string => `${pick(CAN, jd + 9)} ${pick(CHI, jd + 1)}`;

/** Chi cua ngay (0..11) — nen tang de tinh gio hoang dao va truc than. */
export const chiIndexOfDay = (jd: number): number => (jd + 1) % 12;

/**
 * 12 gio am lich (moi gio = 2 tieng). Bang gio hoang dao co dien,
 * tra theo chi cua ngay: '1' = hoang dao, '0' = hac dao.
 */
const GIO_HOANG_DAO = [
  '110100101100', // Ty, Ngo
  '001101001011', // Suu, Mui
  '110011010010', // Dan, Than
  '101100110100', // Mao, Dau
  '001011001101', // Thin, Tuat
  '010010110011', // Ty(ran), Hoi
] as const;

export interface LuckyHour {
  /** Ten chi cua gio, vd "Tý" */
  chi: string;
  /** Khung gio duong lich, vd "23:00 – 00:59" */
  range: string;
  auspicious: boolean;
}

/** Gio hoang dao trong ngay (dua tren chi cua ngay). */
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

/** Can chi cua gio dau tien (gio Ty) trong ngay. */
export const canChiHour = (jd: number): string => `${pick(CAN, (jd - 1) * 2)} Tý`;

/**
 * 12 truc than theo thang am lich — co so cua "ngay hoang dao / hac dao".
 * Luu y: day la TRI THUC VAN HOA truyen thong, trinh bay de tham khao,
 * khong phai loi khuyen hay phan menh.
 */
const TRUC_THAN = [
  'Thanh Long', 'Minh Đường', 'Thiên Hình', 'Chu Tước', 'Kim Quỹ', 'Bảo Quang',
  'Bạch Hổ', 'Ngọc Đường', 'Thiên Lao', 'Nguyên Vũ', 'Tư Mệnh', 'Câu Trận',
] as const;
export const TRUC_THAN_LIST = TRUC_THAN;
const GOOD_OFFSETS = new Set([0, 1, 4, 5, 7, 10]);
/** Thanh Long dong o chi nao, theo nhom thang 1&7, 2&8, ... */
const START_CHI_BY_MONTH = [0, 2, 4, 6, 8, 10];

export interface DayQuality {
  /** Chi so truc than 0..11 — de UI dich */
  starIndex: number;
  /** Ten truc than truc nhat */
  star: string;
  /** true = hoang dao, false = hac dao */
  auspicious: boolean;
}

export function dayQuality(jd: number, lunarMonth: number): DayQuality {
  const start = START_CHI_BY_MONTH[(lunarMonth - 1) % 6]!;
  const offset = (chiIndexOfDay(jd) - start + 12) % 12;
  return { starIndex: offset, star: TRUC_THAN[offset]!, auspicious: GOOD_OFFSETS.has(offset) };
}

/** Thu trong tuan (0 = Chu Nhat). */
export const WEEKDAY_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const;

export function weekdayOf(dd: number, mm: number, yy: number): string {
  return WEEKDAY_VI[(jdFromDate(dd, mm, yy) + 1) % 7]!;
}
