import { asTT, type JdTT } from '../time/julian.js';
import { sunApparentLongitude } from './sun.js';

/** Normalise an angular difference to (-180, 180]. NEVER compare raw longitudes. */
export const wrap180 = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * The instant (TT) at which the Sun's APPARENT longitude reaches `targetDeg`.
 *
 * Solar longitude increases monotonically (~0.9856°/day), so bisection always
 * converges.
 *
 * @param nearJd    a rough starting guess (any JD nearby)
 * @param targetDeg the longitude to reach (0, 15, 30… for solar terms)
 */
export function solarLongitudeTime(nearJd: number, targetDeg: number, toleranceDays = 1e-6): JdTT {
  const f = (jd: number): number => wrap180(sunApparentLongitude(asTT(jd)) - targetDeg);

  // Initial guess: step along the mean rate, then bracket by ±3 days
  let guess = nearJd - f(nearJd) / 0.9856473;
  let lo = guess - 3;
  let hi = guess + 3;

  let flo = f(lo);
  let fhi = f(hi);
  // Widen the bracket until the sign changes (up to ±20 days)
  let span = 3;
  while (flo * fhi > 0 && span < 20) {
    span += 2;
    lo = guess - span;
    hi = guess + span;
    flo = f(lo);
    fhi = f(hi);
  }
  if (flo * fhi > 0) throw new Error(`Could not bracket longitude ${targetDeg} near JD ${nearJd}`);

  while (hi - lo > toleranceDays) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (flo * fmid <= 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return asTT((lo + hi) / 2);
}
