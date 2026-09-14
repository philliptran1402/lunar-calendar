import type { JdTT, JdUT } from './julian.js';
import { asUT } from './julian.js';

/**
 * DeltaT = TT - UT (giay).
 *
 * Vi sao quan trong: cong thuc thien van cho ra thoi diem theo TT, con lich
 * dung UT. Bo qua DeltaT (hoac tinh tho) se day su kien sai ~70 giay hien nay
 * va ~1570 giay o nam 1000 — du de doi ngay khi su kien roi gan nua dem,
 * va sai LECH HE THONG chu khong ngau nhien.
 *
 * Nguon: Espenak & Meeus (2006), da thuc tung doan, NASA dung cho lich nhat thuc.
 * https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
 */

/**
 * Gia tri DO DUOC (IERS/USNO) cho giai doan hien dai.
 * Da thuc 2005–2050 cua Espenak–Meeus du doan ~75.1s cho 2026, trong khi
 * quan trac thuc ~69–71s. Voi giai doan nay ta dung so do, khong dung du doan.
 * Don vi: giay. Nen cap nhat dinh ky tu https://maia.usno.navy.mil/products/deltaT
 */
const MEASURED: ReadonlyArray<readonly [year: number, dt: number]> = [
  [1980, 50.5], [1985, 54.3], [1990, 56.9], [1995, 60.8], [2000, 63.8],
  [2005, 64.7], [2010, 66.1], [2015, 67.6], [2020, 69.4], [2022, 69.3],
  [2024, 69.2], [2026, 69.3],
];

const MEASURED_FROM = MEASURED[0]![0];
const MEASURED_TO = MEASURED[MEASURED.length - 1]![0];

/** Nam thap phan tu Julian Day (du chinh xac cho DeltaT). */
export const decimalYearFromJd = (jd: number): number => 2000 + (jd - 2451545.0) / 365.25;

function interpolateMeasured(year: number): number {
  for (let i = 0; i < MEASURED.length - 1; i++) {
    const [y0, d0] = MEASURED[i]!;
    const [y1, d1] = MEASURED[i + 1]!;
    if (year >= y0 && year <= y1) return d0 + ((d1 - d0) * (year - y0)) / (y1 - y0);
  }
  return MEASURED[MEASURED.length - 1]![1];
}

/** Espenak & Meeus (2006) — da thuc tung doan, don vi giay. */
function espenakMeeus(year: number): number {
  const u = (y: number, c: number) => (y - c) / 100;
  let t: number;

  if (year < -500) {
    const u0 = (year - 1820) / 100;
    return -20 + 32 * u0 * u0;
  }
  if (year < 500) {
    t = year / 100;
    return (
      10583.6 - 1014.41 * t + 33.78311 * t ** 2 - 5.952053 * t ** 3 -
      0.1798452 * t ** 4 + 0.022174192 * t ** 5 + 0.0090316521 * t ** 6
    );
  }
  if (year < 1600) {
    t = (year - 1000) / 100;
    return (
      1574.2 - 556.01 * t + 71.23472 * t ** 2 + 0.319781 * t ** 3 -
      0.8503463 * t ** 4 - 0.005050998 * t ** 5 + 0.0083572073 * t ** 6
    );
  }
  if (year < 1700) {
    t = year - 1600;
    return 120 - 0.9808 * t - 0.01532 * t ** 2 + t ** 3 / 7129;
  }
  if (year < 1800) {
    t = year - 1700;
    return 8.83 + 0.1603 * t - 0.0059285 * t ** 2 + 0.00013336 * t ** 3 - t ** 4 / 1174000;
  }
  if (year < 1860) {
    t = year - 1800;
    return (
      13.72 - 0.332447 * t + 0.0068612 * t ** 2 + 0.0041116 * t ** 3 -
      0.00037436 * t ** 4 + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6 +
      0.000000000875 * t ** 7
    );
  }
  if (year < 1900) {
    t = year - 1860;
    return (
      7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 -
      0.0004473624 * t ** 4 + t ** 5 / 233174
    );
  }
  if (year < 1920) {
    t = year - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (year < 1941) {
    t = year - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (year < 1961) {
    t = year - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (year < 1986) {
    t = year - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (year < 2005) {
    t = year - 2000;
    return (
      63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 +
      0.000651814 * t ** 4 + 0.00002373599 * t ** 5
    );
  }
  if (year < 2050) {
    t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  if (year < 2150) {
    const u1 = u(year, 1820);
    return -20 + 32 * u1 * u1 - 0.5628 * (2150 - year);
  }
  const u2 = u(year, 1820);
  return -20 + 32 * u2 * u2;
}

/** Cho phep nguoi dung nap gia tri DeltaT rieng (vd tu IERS moi hon). */
export type DeltaTProvider = (decimalYear: number) => number;

let provider: DeltaTProvider | null = null;
export const setDeltaTProvider = (fn: DeltaTProvider | null): void => {
  provider = fn;
};

/**
 * So nam chuyen tiep tu "so do" sang "du doan". Khong noi truc tiep vi da thuc
 * Espenak-Meeus lech cao o giai doan nay (75.2s cho 2026 vs ~69.3s do duoc):
 * noi truc tiep se tao BUOC NHAY ~6 giay ngay tai bien — sai lech he thong.
 */
const BLEND_YEARS = 25;

/** DeltaT (giay) tai thoi diem jd. */
export function deltaTSeconds(jd: number): number {
  const year = decimalYearFromJd(jd);
  if (provider) return provider(year);

  if (year <= MEASURED_FROM) return espenakMeeus(year);
  if (year <= MEASURED_TO) return interpolateMeasured(year);

  // Sau moc do cuoi: pha dan tu gia tri do duoc sang da thuc du doan
  const last = MEASURED[MEASURED.length - 1]![1];
  if (year < MEASURED_TO + BLEND_YEARS) {
    const w = (year - MEASURED_TO) / BLEND_YEARS; // 0 -> 1
    return last * (1 - w) + espenakMeeus(year) * w;
  }
  return espenakMeeus(year);
}

/** TT -> UT. */
export const ttToUt = (jdTT: JdTT): JdUT => asUT(jdTT - deltaTSeconds(jdTT) / 86400);
