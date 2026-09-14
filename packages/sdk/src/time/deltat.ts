import type { JdTT, JdUT } from './julian.js';
import { asUT } from './julian.js';

/**
 * ΔT = TT − UT, in seconds.
 *
 * Why it matters: the astronomical series yield instants in TT, while calendars
 * are kept in UT. Ignoring ΔT (or approximating it crudely) misplaces events by
 * ~70 s today and ~1570 s in the year 1000 — enough to change the date when an
 * event falls near midnight, and the error is SYSTEMATIC rather than random.
 *
 * Source: Espenak & Meeus (2006) piecewise polynomials, as used by NASA for
 * eclipse predictions. https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
 */

/**
 * MEASURED values (IERS/USNO) for the modern era, in seconds.
 *
 * The Espenak–Meeus 2005–2050 polynomial predicts ~75.1 s for 2026 while the
 * observed value is ~69–71 s, so measurements win wherever we have them.
 * Refresh periodically from https://maia.usno.navy.mil/products/deltaT
 */
const MEASURED: ReadonlyArray<readonly [year: number, dt: number]> = [
  [1980, 50.5], [1985, 54.3], [1990, 56.9], [1995, 60.8], [2000, 63.8],
  [2005, 64.7], [2010, 66.1], [2015, 67.6], [2020, 69.4], [2022, 69.3],
  [2024, 69.2], [2026, 69.3],
];

const MEASURED_FROM = MEASURED[0]![0];
const MEASURED_TO = MEASURED[MEASURED.length - 1]![0];

/** Decimal year from a Julian Day (precise enough for ΔT). */
export const decimalYearFromJd = (jd: number): number => 2000 + (jd - 2451545.0) / 365.25;

function interpolateMeasured(year: number): number {
  for (let i = 0; i < MEASURED.length - 1; i++) {
    const [y0, d0] = MEASURED[i]!;
    const [y1, d1] = MEASURED[i + 1]!;
    if (year >= y0 && year <= y1) return d0 + ((d1 - d0) * (year - y0)) / (y1 - y0);
  }
  return MEASURED[MEASURED.length - 1]![1];
}

/** Espenak & Meeus (2006) — piecewise polynomials, in seconds. */
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

/** Supply your own ΔT source (for example a fresher IERS series). */
export type DeltaTProvider = (decimalYear: number) => number;

let provider: DeltaTProvider | null = null;
export const setDeltaTProvider = (fn: DeltaTProvider | null): void => {
  provider = fn;
};

/**
 * Years spent blending measurements into prediction. A hard handover would
 * introduce a ~6-second STEP at the boundary (the polynomial reads 75.2 s for
 * 2026 against ~69.3 s measured) — i.e. a systematic error.
 */
const BLEND_YEARS = 25;

/** ΔT in seconds at instant `jd`. */
export function deltaTSeconds(jd: number): number {
  const year = decimalYearFromJd(jd);
  if (provider) return provider(year);

  if (year <= MEASURED_FROM) return espenakMeeus(year);
  if (year <= MEASURED_TO) return interpolateMeasured(year);

  // Past the last measurement: fade from the measured value into the polynomial
  const last = MEASURED[MEASURED.length - 1]![1];
  if (year < MEASURED_TO + BLEND_YEARS) {
    const w = (year - MEASURED_TO) / BLEND_YEARS; // 0 -> 1
    return last * (1 - w) + espenakMeeus(year) * w;
  }
  return espenakMeeus(year);
}

/** Convert TT to UT. */
export const ttToUt = (jdTT: JdTT): JdUT => asUT(jdTT - deltaTSeconds(jdTT) / 86400);
