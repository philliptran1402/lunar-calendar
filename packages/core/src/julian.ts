/**
 * Julian Day Number — nen tang cua moi phep tinh lich.
 * Xu ly dung moc chuyen Julian -> Gregorian (5/10/1582) de lich su khong sai.
 */

export const int = (n: number): number => Math.floor(n);

/** Ngay duong lich -> so ngay Julian. */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = int((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd + int((153 * m + 2) / 5) + 365 * y + int(y / 4) - int(y / 100) + int(y / 400) - 32045;
  if (jd < 2299161) {
    // Truoc 15/10/1582 dung lich Julius
    jd = dd + int((153 * m + 2) / 5) + 365 * y + int(y / 4) - 32083;
  }
  return jd;
}

/** So ngay Julian -> ngay duong lich [dd, mm, yy]. */
export function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = int((4 * a + 3) / 146097);
    c = a - int((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = int((4 * c + 3) / 1461);
  const e = c - int((1461 * d) / 4);
  const m = int((5 * e + 2) / 153);
  const day = e - int((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * int(m / 10);
  const year = b * 100 + d - 4800 + int(m / 10);
  return [day, month, year];
}
