import { type JdTT, asTT } from '../time/julian.js';

const DEG = Math.PI / 180;

/**
 * Thoi diem TRUNG TAM CUA TRANG MOI (New Moon) theo TT.
 * Meeus ch.49 BAN DAY DU: 25 so hang tuan hoan + 14 hieu chinh hanh tinh A1..A14.
 *
 * Vi sao phai co A1..A14: bien do cong don toi ~0.00129 ngay = 112 GIAY.
 * Cac ban rut gon pho bien bo han phan nay — do la nguon sai lon nhat cua chung.
 * Do chinh xac cua ban day du (Meeus doi chieu ly thuyet day du 1980-2020):
 * sai so trung binh ~4 giay, toi da ~17 giay.
 *
 * @param k so thu tu ky trang moi tinh tu trang moi ngay 2000-01-06.
 */
export function newMoonTT(k: number): JdTT {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // Pha trung binh
  let jde =
    2451550.09766 +
    29.530588861 * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  // Do lech tam quy dao Trai Dat
  const E = 1 - 0.002516 * T - 0.0000074 * T2;

  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * DEG; // di thuong Mat Troi
  const Mp =
    (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * DEG; // di thuong Mat Trang
  const F =
    (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * DEG; // doi so vi do
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * DEG; // nut len

  const sin = Math.sin;
  // 25 so hang tuan hoan cho TRANG MOI (Meeus 49, bang ung voi pha moi)
  jde +=
    -0.4072 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(Om) -
    0.00007 * sin(Mp + 2 * M) +
    0.00004 * sin(2 * Mp - 2 * F) +
    0.00004 * sin(3 * M) +
    0.00003 * sin(Mp + M - 2 * F) +
    0.00003 * sin(2 * Mp + 2 * F) -
    0.00003 * sin(Mp + M + 2 * F) +
    0.00003 * sin(Mp - M + 2 * F) -
    0.00002 * sin(Mp - M - 2 * F) -
    0.00002 * sin(3 * Mp + M) +
    0.00002 * sin(4 * Mp);

  // 14 hieu chinh hanh tinh — PHAN MA BAN RUT GON BO DI (toi 112 giay)
  const A: ReadonlyArray<readonly [amp: number, deg: number]> = [
    [0.000325, 299.77 + 0.107408 * k - 0.009173 * T2],
    [0.000165, 251.88 + 0.016321 * k],
    [0.000164, 251.83 + 26.651886 * k],
    [0.000126, 349.42 + 36.412478 * k],
    [0.00011, 84.66 + 18.206239 * k],
    [0.000062, 141.74 + 53.303771 * k],
    [0.00006, 207.14 + 2.453732 * k],
    [0.000056, 154.84 + 7.30686 * k],
    [0.000047, 34.52 + 27.261239 * k],
    [0.000042, 207.19 + 0.121824 * k],
    [0.00004, 291.34 + 1.844379 * k],
    [0.000037, 161.72 + 24.198154 * k],
    [0.000035, 239.56 + 25.513099 * k],
    [0.000023, 331.55 + 3.592518 * k],
  ];
  for (const [amp, deg] of A) jde += amp * sin(deg * DEG);

  return asTT(jde);
}

/** So ky trang moi gan dung chua thoi diem jd. */
export const newMoonIndexNear = (jd: number): number =>
  Math.round((jd - 2451550.09766) / 29.530588861);
