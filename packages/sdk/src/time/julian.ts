/**
 * Thang thoi gian. Diem mau chot cua do chinh xac: PHAI phan biet
 *   TT (Terrestrial Time)  — thang dung trong cong thuc thien van
 *   UT (Universal Time)    — thang dung cho lich dan dung
 * Hai thang lech nhau DeltaT (~70 giay hien nay, ~1570 giay nam 1000).
 * Lan lon hai cai nay la nguon sai ngay CO HE THONG.
 */

/** Julian Day theo thang TT — chi dung trong tinh toan thien van. */
export type JdTT = number & { readonly __scale: 'TT' };
/** Julian Day theo thang UT — dung de quy ra ngay/gio dia phuong. */
export type JdUT = number & { readonly __scale: 'UT' };

export const asTT = (jd: number): JdTT => jd as JdTT;
export const asUT = (jd: number): JdUT => jd as JdUT;

export const J2000 = 2451545.0;
/** The ky Julius tu J2000, dung cho moi chuoi thien van. */
export const centuriesFromJ2000 = (jdTT: JdTT): number => (jdTT - J2000) / 36525;

const floor = Math.floor;

/**
 * Ngay duong lich (Gregorian/Julian) -> Julian Day.
 * `day` co the co phan thap phan de bieu dien gio trong ngay.
 */
export function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  // Moc doi lich Julius -> Gregory: 15/10/1582
  const gregorian = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  const b = gregorian ? 2 - floor(y / 100) + floor(floor(y / 100) / 4) : 0;
  return floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

export interface CivilDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Julian Day -> ngay duong lich (co gio). */
export function fromJulianDay(jd: number): CivilDateTime {
  const z = floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - floor(alpha / 4);
  }
  const b = a + 1524;
  const c = floor((b - 122.1) / 365.25);
  const d = floor(365.25 * c);
  const e = floor((b - d) / 30.6001);

  const dayFrac = b - d - floor(30.6001 * e) + f;
  const day = floor(dayFrac);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  let rest = (dayFrac - day) * 24;
  const hour = floor(rest);
  rest = (rest - hour) * 60;
  const minute = floor(rest);
  const second = Math.round((rest - minute) * 60);
  return second === 60
    ? { year, month, day, hour, minute: minute + 1, second: 0 }
    : { year, month, day, hour, minute, second };
}

/**
 * So ngay lich (so nguyen) chua thoi diem jd theo mui gio `tzHours`.
 * Day la ham quyet dinh "su kien roi vao NGAY NAO" — trai tim cua lich am.
 */
export function localMidnightDayNumber(jdUT: JdUT, tzHours: number): number {
  return floor(jdUT + 0.5 + tzHours / 24);
}

/** Julian Day luc 00:00 gio dia phuong cua mot so ngay lich. */
export const dayNumberToJdUT = (dayNumber: number, tzHours: number): JdUT =>
  asUT(dayNumber - 0.5 - tzHours / 24);

/**
 * So ngay lich -> ngay duong lich.
 * Nghich dao chinh xac cua localMidnightDayNumber(jd, 0): vi
 * dayNumber = floor(jd + 0.5) nen jd tai nua dem la dayNumber - 0.5.
 * (Nham dau cong/tru o day la loi LECH MOT NGAY rat kho thay.)
 */
export const dayNumberToCivilDate = (dayNumber: number): { year: number; month: number; day: number } => {
  const { year, month, day } = fromJulianDay(dayNumber - 0.5);
  return { year, month, day };
};
