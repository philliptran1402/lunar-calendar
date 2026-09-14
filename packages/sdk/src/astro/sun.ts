import { centuriesFromJ2000, type JdTT } from '../time/julian.js';
import { nutationInLongitude } from './nutation.js';

const DEG = Math.PI / 180;
const norm360 = (x: number): number => ((x % 360) + 360) % 360;

/* ---------------------------------------------------------------------------
 * VSOP87D (rut gon) cho kinh do nhat tam cua Trai Dat.
 * Moi so hang: [A, B, C] -> A * cos(B + C * tau), tau = thien nien ky Julius.
 * Don vi A: 1e-8 radian. Giu cac so hang >= ~100 (0.2") — phan bo di dong gop
 * duoi muc sai so muc tieu, doi lai kich thuoc bundle nho.
 * Nguon: Meeus, Astronomical Algorithms 2nd ed., Appendix III (VSOP87 abridged).
 * ------------------------------------------------------------------------ */
const L0: ReadonlyArray<readonly [number, number, number]> = [
  [175347046, 0, 0], [3341656, 4.6692568, 6283.07585], [34894, 4.6261, 12566.1517],
  [3497, 2.7441, 5753.3849], [3418, 2.8289, 3.5231], [3136, 3.6277, 77713.7715],
  [2676, 4.4181, 7860.4194], [2343, 6.1352, 3930.2097], [1324, 0.7425, 11506.7698],
  [1273, 2.0371, 529.691], [1199, 1.1096, 1577.3435], [990, 5.233, 5884.927],
  [902, 2.045, 26.298], [857, 3.508, 398.149], [780, 1.179, 5223.694],
  [753, 2.533, 5507.553], [505, 4.583, 18849.228], [492, 4.205, 775.523],
  [357, 2.92, 0.067], [317, 5.849, 11790.629], [284, 1.899, 796.298],
  [271, 0.315, 10977.079], [243, 0.345, 5486.778], [206, 4.806, 2544.314],
  [205, 1.869, 5573.143], [202, 2.458, 6069.777], [156, 0.833, 213.299],
  [132, 3.411, 2942.463], [126, 1.083, 20.775], [115, 0.645, 0.98],
  [103, 0.636, 4694.003], [102, 0.976, 15720.839], [102, 4.267, 7.114],
  [99, 6.21, 2146.17], [98, 0.68, 155.42], [86, 5.98, 161000.69],
  [85, 1.3, 6275.96], [85, 3.67, 71430.7], [80, 1.81, 17260.15],
  [79, 3.04, 12036.46], [75, 1.76, 5088.63], [74, 3.5, 3154.69],
  [74, 4.68, 801.82], [70, 0.83, 9437.76], [62, 3.98, 8827.39],
  [61, 1.82, 7084.9], [57, 2.78, 6286.6], [56, 4.39, 14143.5],
  [56, 3.47, 6279.55], [52, 0.19, 12139.55], [52, 1.33, 1748.02],
  [51, 0.28, 5856.48], [49, 0.49, 1194.45], [41, 5.37, 8429.24],
  [41, 2.4, 19651.05], [39, 6.17, 10447.39], [37, 6.04, 10213.29],
  [37, 2.57, 1059.38], [36, 1.71, 2352.87], [36, 1.78, 6812.77],
  [33, 0.59, 17789.85], [30, 0.44, 83996.85], [30, 2.74, 1349.87],
  [25, 3.16, 4690.48],
];
const L1: ReadonlyArray<readonly [number, number, number]> = [
  [628331966747, 0, 0], [206059, 2.678235, 6283.07585], [4303, 2.6351, 12566.1517],
  [425, 1.59, 3.523], [119, 5.796, 26.298], [109, 2.966, 1577.344],
  [93, 2.59, 18849.23], [72, 1.14, 529.69], [68, 1.87, 398.15],
  [67, 4.41, 5507.55], [59, 2.89, 5223.69], [56, 2.17, 155.42],
  [45, 0.4, 796.3], [36, 0.47, 775.52], [29, 2.65, 7.11],
  [21, 5.34, 0.98], [19, 1.85, 5486.78], [19, 4.97, 213.3],
  [17, 2.99, 6275.96], [16, 0.03, 2544.31], [16, 1.43, 2146.17],
  [15, 1.21, 10977.08], [12, 2.83, 1748.02], [12, 3.26, 5088.63],
  [12, 5.27, 1194.45], [12, 2.08, 4694.0], [11, 0.77, 553.57],
  [10, 1.3, 6286.6], [10, 4.24, 1349.87], [9, 2.7, 242.73],
  [9, 5.64, 951.72], [8, 5.3, 2352.87], [6, 2.65, 9437.76],
  [6, 4.67, 4690.48],
];
const L2: ReadonlyArray<readonly [number, number, number]> = [
  [52919, 0, 0], [8720, 1.0721, 6283.0758], [309, 0.867, 12566.152],
  [27, 0.05, 3.52], [16, 5.19, 26.3], [16, 3.68, 155.42],
  [10, 0.76, 18849.23], [9, 2.06, 77713.77], [7, 0.83, 775.52],
  [5, 4.66, 1577.34], [4, 1.03, 7.11], [4, 3.44, 5573.14],
  [3, 5.14, 796.3], [3, 6.05, 5507.55], [3, 1.19, 242.73],
  [3, 6.12, 529.69], [3, 0.31, 398.15], [3, 2.28, 553.57],
  [2, 4.38, 5223.69], [2, 3.75, 0.98],
];
const L3: ReadonlyArray<readonly [number, number, number]> = [
  [289, 5.844, 6283.076], [35, 0, 0], [17, 5.49, 12566.15],
  [3, 5.2, 155.42], [1, 4.72, 3.52], [1, 5.3, 18849.23], [1, 5.97, 242.73],
];
const L4: ReadonlyArray<readonly [number, number, number]> = [[114, 3.142, 0], [8, 4.13, 6283.08]];

const series = (terms: ReadonlyArray<readonly [number, number, number]>, tau: number): number =>
  terms.reduce((sum, [a, b, c]) => sum + a * Math.cos(b + c * tau), 0);

/**
 * Kinh do HINH HOC cua Mat Troi (do), he toa do dong cua ngay (VSOP87 + FK5).
 */
export function sunGeometricLongitude(jdTT: JdTT): number {
  const tau = centuriesFromJ2000(jdTT) / 10; // thien nien ky
  const lEarth =
    (series(L0, tau) +
      series(L1, tau) * tau +
      series(L2, tau) * tau ** 2 +
      series(L3, tau) * tau ** 3 +
      series(L4, tau) * tau ** 4) *
    1e-8; // radian

  // Kinh do Mat Troi nhin tu Trai Dat = kinh do Trai Dat + 180 do
  let theta = norm360((lEarth * 180) / Math.PI + 180);

  // VSOP87 -> FK5 (Meeus 32.3). So hang thu hai ti le tan(vi do); vi do cua
  // Mat Troi < 1" nen bo qua, chi giu hang co dinh -0.09033".
  return norm360(theta - 0.09033 / 3600);
}

/**
 * Kinh do BIEU KIEN cua Mat Troi (do) — dung cai NAY cho tiet khi.
 * = hinh hoc + chuong sai + tinh sai (aberration).
 * Thieu hai hieu chinh nay lam lech toi ~15 phut thoi gian (Meeus ch.25).
 */
export function sunApparentLongitude(jdTT: JdTT): number {
  const theta = sunGeometricLongitude(jdTT);
  const dPsi = nutationInLongitude(jdTT); // chuong sai (do)
  const aberration = -20.4898 / 3600 / earthSunDistance(jdTT); // tinh sai nam (do)
  return norm360(theta + dPsi + aberration);
}

/** Khoang cach Trai Dat - Mat Troi (AU) — can cho tinh sai. */
function earthSunDistance(jdTT: JdTT): number {
  const T = centuriesFromJ2000(jdTT);
  const m = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const c =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(m) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * m) +
    0.000289 * Math.sin(3 * m);
  const v = (m * 180) / Math.PI + c;
  return (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(v * DEG));
}

/**
 * Cong thuc do chinh xac THAP cua Meeus (25.10) — giu lai de so sanh/kiem thu.
 * Sai so ~0.01 do = 36" ~ 15 phut thoi gian. KHONG dung cho lich.
 */
export function sunApparentLongitudeLowPrecision(jdTT: JdTT): number {
  const T = centuriesFromJ2000(jdTT);
  const l0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const m = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
  const c =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(m) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * m) +
    0.000289 * Math.sin(3 * m);
  const omega = (125.04 - 1934.136 * T) * DEG;
  return norm360(l0 + c - 0.00569 - 0.00478 * Math.sin(omega));
}
