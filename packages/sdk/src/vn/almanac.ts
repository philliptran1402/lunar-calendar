import type { TimeZoneResolver } from '../calendar/lunisolar.js';
import { julianDay } from '../time/julian.js';
import {
  canChiDay,
  canChiHour,
  canChiMonth,
  canChiYear,
  conGiapIndex,
  conGiapYear,
  dayQuality,
  luckyHours,
  weekdayIndexOf,
  weekdayOf,
  type DayQuality,
  type LuckyHour,
} from './canchi.js';
import { holidaysOf, type Holiday } from './holiday.js';
import { lunarMonthLength, solarToLunar, VN_TIMEZONE } from './index.js';
import { isSolarTermStart, solarTermIndexOf, solarTermOf, type SolarTerm } from './solar-term.js';

/**
 * Julian Day dang SO NGUYEN (moc giua trua) — quy uoc ma cac bang can chi
 * co dien su dung. Khac voi `julianDay()` (tra ve moc nua dem, X.5).
 */
export const integerJd = (day: number, month: number, year: number): number =>
  Math.floor(julianDay(year, month, day) + 0.5);

export interface DayInfo {
  solar: { day: number; month: number; year: number; weekday: string; weekdayIndex: number };
  lunar: {
    day: number;
    month: number;
    year: number;
    leap: boolean;
    monthLength: number;
    /** true = thoi diem soc qua sat nua dem, ngay am co the lech 1 ngay */
    uncertain: boolean;
  };
  canChi: { year: string; month: string; day: string; hour: string };
  conGiap: string;
  conGiapIndex: number;
  solarTerm: { name: SolarTerm; index: number; isStart: boolean };
  quality: DayQuality;
  luckyHours: LuckyHour[];
  holidays: Holiday[];
  /** Julian Day dang so nguyen */
  jd: number;
}

/** Toan bo thong tin lich cua mot ngay duong lich. */
export function getDayInfo(
  day: number,
  month: number,
  year: number,
  tz: TimeZoneResolver = VN_TIMEZONE,
): DayInfo {
  const jd = integerJd(day, month, year);
  const lunar = solarToLunar(day, month, year, tz);
  const monthLength = lunarMonthLength(lunar.month, lunar.year, lunar.leap, tz);

  return {
    solar: {
      day,
      month,
      year,
      weekday: weekdayOf(day, month, year),
      weekdayIndex: weekdayIndexOf(day, month, year),
    },
    lunar: { ...lunar, monthLength },
    canChi: {
      year: canChiYear(lunar.year),
      month: canChiMonth(lunar.month, lunar.year),
      day: canChiDay(jd),
      hour: canChiHour(jd),
    },
    conGiap: conGiapYear(lunar.year),
    conGiapIndex: conGiapIndex(lunar.year),
    solarTerm: {
      name: solarTermOf(day, month, year, tz),
      index: solarTermIndexOf(day, month, year, tz),
      isStart: isSolarTermStart(day, month, year, tz),
    },
    quality: dayQuality(jd, lunar.month),
    luckyHours: luckyHours(jd),
    holidays: holidaysOf({ day, month }, lunar, monthLength),
    jd,
  };
}

/**
 * Luoi lich thang: luon 6 hang x 7 cot (42 o), tuan bat dau THU HAI (chuan VN).
 */
export function getMonthGrid(
  month: number,
  year: number,
  tz: TimeZoneResolver = VN_TIMEZONE,
): DayInfo[] {
  const firstJd = integerJd(1, month, year);
  const weekdayOfFirst = (firstJd + 1) % 7; // 0 = Chu Nhat
  const leading = (weekdayOfFirst + 6) % 7; // doi sang tuan bat dau Thu Hai
  const startJd = firstJd - leading;

  const cells: DayInfo[] = [];
  for (let i = 0; i < 42; i++) {
    const { year: y, month: m, day: d } = civilFromJd(startJd + i);
    cells.push(getDayInfo(d, m, y, tz));
  }
  return cells;
}

/** Nghich dao cua `integerJd`: Julian Day so nguyen -> ngay duong lich. */
export function civilFromJd(jd: number): { year: number; month: number; day: number } {
  let a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}
