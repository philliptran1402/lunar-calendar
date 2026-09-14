import {
  canChiDay,
  conGiapIndex,
  weekdayIndexOf,
  canChiHour,
  canChiMonth,
  canChiYear,
  conGiapYear,
  dayQuality,
  luckyHours,
  weekdayOf,
  type DayQuality,
  type LuckyHour,
} from './canchi.js';
import { holidaysOf, type Holiday } from './holiday.js';
import { jdFromDate, jdToDate } from './julian.js';
import { lunarMonthLength, solarToLunar, VN_TIMEZONE, type LunarDate } from './lunar.js';
import { isSolarTermStart, solarTermIndexOf, solarTermOf, type SolarTerm } from './solar-term.js';

export interface DayInfo {
  solar: { day: number; month: number; year: number; weekday: string; weekdayIndex: number };
  lunar: LunarDate & { monthLength: number };
  canChi: { year: string; month: string; day: string; hour: string };
  conGiap: string;
  conGiapIndex: number;
  solarTerm: { name: SolarTerm; index: number; isStart: boolean };
  quality: DayQuality;
  luckyHours: LuckyHour[];
  holidays: Holiday[];
  jd: number;
}

/** Toan bo thong tin lich cua mot ngay duong lich. */
export function getDayInfo(
  dd: number,
  mm: number,
  yy: number,
  timeZone: number = VN_TIMEZONE,
): DayInfo {
  const jd = jdFromDate(dd, mm, yy);
  const lunar = solarToLunar(dd, mm, yy, timeZone);
  const monthLength = lunarMonthLength(lunar.month, lunar.year, lunar.leap, timeZone);

  return {
    solar: { day: dd, month: mm, year: yy, weekday: weekdayOf(dd, mm, yy), weekdayIndex: weekdayIndexOf(dd, mm, yy) },
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
      name: solarTermOf(jd, timeZone),
      index: solarTermIndexOf(jd, timeZone),
      isStart: isSolarTermStart(jd, timeZone),
    },
    quality: dayQuality(jd, lunar.month),
    luckyHours: luckyHours(jd),
    holidays: holidaysOf({ day: dd, month: mm }, lunar, monthLength),
    jd,
  };
}

/**
 * Luoi lich thang duong: luon 6 hang x 7 cot (42 o), tuan bat dau THU HAI
 * (chuan VN, khac My bat dau Chu Nhat).
 */
export function getMonthGrid(month: number, year: number, timeZone: number = VN_TIMEZONE): DayInfo[] {
  const firstJd = jdFromDate(1, month, year);
  // (jd + 1) % 7: 0 = Chu Nhat. Doi sang tuan bat dau Thu Hai.
  const weekdayOfFirst = (firstJd + 1) % 7;
  const leading = (weekdayOfFirst + 6) % 7;
  const startJd = firstJd - leading;

  const cells: DayInfo[] = [];
  for (let i = 0; i < 42; i++) {
    const jd = startJd + i;
    const [d, m, y] = jdToDate(jd);
    cells.push(getDayInfo(d, m, y, timeZone));
  }
  return cells;
}
