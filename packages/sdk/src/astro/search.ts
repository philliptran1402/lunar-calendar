import { asTT, type JdTT } from '../time/julian.js';
import { sunApparentLongitude } from './sun.js';

/** Dua hieu goc ve (-180, 180] — KHONG bao gio so sanh kinh do tho. */
export const wrap180 = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * Thoi diem (TT) kinh do BIEU KIEN cua Mat Troi dat dung `targetDeg`.
 * Kinh do Mat Troi don dieu tang (~0.9856 do/ngay) nen chia doi la chac chan hoi tu.
 *
 * @param nearJd moc phong doan (JD, bat ky thang nao)
 * @param targetDeg moc kinh do can dat (0, 15, 30... cho tiet khi)
 */
export function solarLongitudeTime(nearJd: number, targetDeg: number, toleranceDays = 1e-6): JdTT {
  const f = (jd: number): number => wrap180(sunApparentLongitude(asTT(jd)) - targetDeg);

  // Uoc luong ban dau: dich theo toc do trung binh roi bao khoang +-3 ngay
  let guess = nearJd - f(nearJd) / 0.9856473;
  let lo = guess - 3;
  let hi = guess + 3;

  let flo = f(lo);
  let fhi = f(hi);
  // Neu chua doi dau, noi rong khoang (toi da +-20 ngay)
  let span = 3;
  while (flo * fhi > 0 && span < 20) {
    span += 2;
    lo = guess - span;
    hi = guess + span;
    flo = f(lo);
    fhi = f(hi);
  }
  if (flo * fhi > 0) throw new Error(`Khong bao duoc nghiem cho kinh do ${targetDeg} gan JD ${nearJd}`);

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
