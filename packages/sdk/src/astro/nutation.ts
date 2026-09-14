import { centuriesFromJ2000, type JdTT } from '../time/julian.js';

const DEG = Math.PI / 180;

/**
 * Chuong sai kinh do (nutation in longitude), don vi DO.
 * Meeus ch.22, dang rut gon — sai so ~0.5" (~12 giay thoi gian Mat Troi).
 * Bo qua chuong sai lam lech kinh do BIEU KIEN toi 17.2" (~7 phut) —
 * du de doi ngay tiet khi.
 */
export function nutationInLongitude(jdTT: JdTT): number {
  const T = centuriesFromJ2000(jdTT);
  const T2 = T * T;
  const D = (297.85036 + 445267.1114800 * T - 0.0019142 * T2) * DEG; // sai phan trung binh
  const M = (357.52772 + 35999.0503400 * T - 0.0001603 * T2) * DEG; // di thuong Mat Troi
  const Mp = (134.96298 + 477198.8673980 * T + 0.0086972 * T2) * DEG; // di thuong Mat Trang
  const F = (93.27191 + 483202.0175380 * T - 0.0036825 * T2) * DEG; // doi so vi do
  const Om = (125.04452 - 1934.1362610 * T + 0.0020708 * T2) * DEG; // nut len

  const sin = Math.sin;
  // 9 so hang lon nhat cua chuoi IAU1980 (don vi 0.0001")
  const t = 0.0001;
  const arcsec =
    t * (-171996 - 174.2 * T) * sin(Om) +
    t * (-13187 - 1.6 * T) * sin(-2 * D + 2 * F + 2 * Om) +
    t * (-2274 - 0.2 * T) * sin(2 * F + 2 * Om) +
    t * (2062 + 0.2 * T) * sin(2 * Om) +
    t * (1426 - 3.4 * T) * sin(M) +
    t * (712 + 0.1 * T) * sin(Mp) +
    t * (-517 + 1.2 * T) * sin(-2 * D + M + 2 * F + 2 * Om) +
    t * (-386 - 0.4 * T) * sin(2 * F + Om) +
    t * -301 * sin(Mp + 2 * F + 2 * Om) +
    t * (217 - 0.5 * T) * sin(-2 * D - M + 2 * F + 2 * Om) +
    t * -158 * sin(-2 * D + Mp) +
    t * (129 + 0.1 * T) * sin(-2 * D + 2 * F + Om) +
    t * 123 * sin(-Mp + 2 * F + 2 * Om);
  return arcsec / 3600;
}
