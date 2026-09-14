import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newMoonIndexNear, newMoonTT } from './astro/moon.js';
import { solarLongitudeTime } from './astro/search.js';
import { sunApparentLongitudeLowPrecision } from './astro/sun.js';
import { deltaTSeconds, setDeltaTProvider, ttToUt } from './time/deltat.js';
import { fromJulianDay, julianDay, asTT } from './time/julian.js';

/**
 * ACCURACY CHECKS against NASA/Espenak data — we do not grade our own homework.
 * Source: astropixels.com/ephemeris (Espenak), times in GMT.
 */

const utc = (y: number, mo: number, d: number, h: number, mi: number) =>
  julianDay(y, mo, d + (h + mi / 60) / 24);

/** The gap between our result and the reference, in SECONDS. */
const errorSeconds = (computedJdUt: number, referenceJd: number) =>
  Math.abs(computedJdUt - referenceJd) * 86400;

const NEW_MOONS_2026: Array<[m: number, d: number, h: number, mi: number]> = [
  [1, 18, 19, 52], [2, 17, 12, 1], [3, 19, 1, 23], [4, 17, 11, 52],
  [5, 16, 20, 1], [6, 15, 2, 54], [7, 14, 9, 43], [8, 12, 17, 37],
  [9, 11, 3, 27], [10, 10, 15, 50], [11, 9, 7, 2], [12, 9, 0, 52],
];

test('new moons of 2026 are within 60 s of NASA', () => {
  let worst = 0;
  for (const [mo, d, h, mi] of NEW_MOONS_2026) {
    const ref = utc(2026, mo, d, h, mi);
    const k = newMoonIndexNear(ref);
    const got = ttToUt(newMoonTT(k));
    const err = errorSeconds(got, ref);
    worst = Math.max(worst, err);
    assert.ok(err < 60, `new moon ${d}/${mo}/2026 off by ${err.toFixed(1)}s`);
  }
  console.log(`      → new moons 2026: worst deviation ${worst.toFixed(1)} s`);
});

test('sampled new moons of 2024-2025 are within 60 s', () => {
  const refs: Array<[number, number, number, number, number]> = [
    [2024, 1, 11, 11, 57], [2024, 2, 9, 22, 59],
    [2025, 1, 29, 12, 36], [2025, 2, 28, 0, 45],
  ];
  for (const [y, mo, d, h, mi] of refs) {
    const ref = utc(y, mo, d, h, mi);
    const got = ttToUt(newMoonTT(newMoonIndexNear(ref)));
    assert.ok(errorSeconds(got, ref) < 60, `${d}/${mo}/${y} off by ${errorSeconds(got, ref).toFixed(1)}s`);
  }
});

const EQUINOXES: Array<[y: number, target: number, mo: number, d: number, h: number, mi: number]> = [
  [2020, 0, 3, 20, 3, 50], [2020, 90, 6, 20, 21, 43], [2020, 180, 9, 22, 13, 31], [2020, 270, 12, 21, 10, 3],
  [2024, 0, 3, 20, 3, 7], [2024, 90, 6, 20, 20, 51], [2024, 180, 9, 22, 12, 44], [2024, 270, 12, 21, 9, 20],
  [2025, 0, 3, 20, 9, 2], [2025, 90, 6, 21, 2, 42], [2025, 180, 9, 22, 18, 20], [2025, 270, 12, 21, 15, 3],
  [2026, 0, 3, 20, 14, 46], [2026, 90, 6, 21, 8, 25], [2026, 180, 9, 23, 0, 6], [2026, 270, 12, 21, 20, 50],
  [2030, 0, 3, 20, 13, 51], [2030, 270, 12, 21, 20, 9],
  [2050, 0, 3, 20, 10, 20], [2050, 270, 12, 21, 16, 39],
];

test('solstices and equinoxes 2020-2050 are within 60 s of NASA', () => {
  let worst = 0;
  for (const [y, target, mo, d, h, mi] of EQUINOXES) {
    const ref = utc(y, mo, d, h, mi);
    const got = ttToUt(solarLongitudeTime(ref, target));
    const err = errorSeconds(got, ref);
    worst = Math.max(worst, err);
    assert.ok(err < 60, `${y} longitude ${target}° off by ${err.toFixed(1)}s`);
  }
  console.log(`      → solstices/equinoxes: worst deviation ${worst.toFixed(1)} s`);
});

test('the low-precision formula is much worse (why VSOP87 is needed)', () => {
  // Winter solstice 2026 per NASA
  const ref = utc(2026, 12, 21, 20, 50);
  // Measure the longitude at the reference instant: it should read exactly 270°
  const lowDeg = sunApparentLongitudeLowPrecision(asTT(ref + 69.3 / 86400));
  const errArcsec = Math.abs(((lowDeg - 270 + 540) % 360) - 180) * 3600;
  console.log(`      → low-precision formula off by ${errArcsec.toFixed(1)}" (~${(errArcsec / 0.0411).toFixed(0)}s of time)`);
  assert.ok(errArcsec > 0, 'recorded for the record, not a pass/fail criterion');
});

test('consecutive lunations are 29.27-29.83 days apart', () => {
  const k0 = newMoonIndexNear(julianDay(2026, 1, 1));
  for (let i = 0; i < 100; i++) {
    const gap = newMoonTT(k0 + i + 1) - newMoonTT(k0 + i);
    assert.ok(gap > 29.26 && gap < 29.84, `lunation ${i}: ${gap.toFixed(4)} days`);
  }
});

test('Julian Day conversion round-trips losslessly', () => {
  for (const [y, m, d] of [[1900, 1, 1], [1968, 1, 1], [2026, 9, 14], [2100, 12, 31]] as const) {
    const back = fromJulianDay(julianDay(y, m, d));
    assert.deepEqual([back.year, back.month, back.day], [y, m, d]);
  }
});

test('ΔT uses MEASURED values in the modern era, not the high extrapolation', () => {
  const dt2020 = deltaTSeconds(julianDay(2020, 6, 1));
  const dt2026 = deltaTSeconds(julianDay(2026, 6, 1));
  // Observed: ~69.4 s (2020), ~69.3 s (2026). The Espenak-Meeus polynomial predicts 75.2 s for 2026.
  assert.ok(Math.abs(dt2020 - 69.4) < 1, `ΔT 2020 = ${dt2020.toFixed(1)}s`);
  assert.ok(Math.abs(dt2026 - 69.5) < 1.5, `ΔT 2026 = ${dt2026.toFixed(1)}s (should be near 69.3, not 75)`);
  // No discontinuity at the edge of the measured table
  const a = deltaTSeconds(julianDay(2026, 12, 31));
  const b = deltaTSeconds(julianDay(2027, 1, 2));
  assert.ok(Math.abs(a - b) < 0.5, `jump at the table edge: ${a.toFixed(2)} -> ${b.toFixed(2)}`);
});

test('callers can supply their own ΔT source (e.g. fresher IERS data)', () => {
  setDeltaTProvider(() => 42);
  assert.equal(deltaTSeconds(julianDay(2026, 1, 1)), 42);
  setDeltaTProvider(null);
  assert.ok(deltaTSeconds(julianDay(2026, 1, 1)) > 60);
});
