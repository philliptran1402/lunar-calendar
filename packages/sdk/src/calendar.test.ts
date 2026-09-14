import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHINA_TIMEZONE, VN_TIMEZONE, getDayInfo, getMonthGrid, leapMonthOf, lunarMonthLength, lunarToSolar, solarToLunar } from './vn/index.js';

/**
 * PHEP THU VANG: cac nam Viet Nam an Tet LECH Trung Quoc.
 * Khac biet duy nhat la mui gio tinh lich (VN 105E = UTC+7, TQ 120E = UTC+8).
 * Neu SDK xu ly dung mui gio VA dung quy tac thang nhuan thi phai tai hien duoc
 * ca 6 truong hop lich su nay. Nguon: Hoang Xuan Han, bao Nhan Dan, RFA.
 */
const TET_VN_VS_CN: Array<[year: number, vn: [number, number], cn: [number, number]]> = [
  [1968, [29, 1], [30, 1]],
  [1969, [16, 2], [17, 2]],
  [1985, [21, 1], [20, 2]], // lech han MOT THANG — do vi tri thang nhuan
  [2007, [17, 2], [18, 2]],
  [2030, [2, 2], [3, 2]],
  [2053, [18, 2], [19, 2]],
];

test('Tet Viet Nam (UTC+7) dung tung nam lich su', () => {
  for (const [y, [d, m]] of TET_VN_VS_CN) {
    const got = lunarToSolar(1, 1, y, false, VN_TIMEZONE);
    assert.ok(got, `khong tinh duoc Tet ${y}`);
    assert.deepEqual([got.day, got.month], [d, m], `Tet ${y} VN`);
  }
});

test('Cung thuat toan, doi sang UTC+8 phai ra dung ngay Tet Trung Quoc', () => {
  for (const [y, , [d, m]] of TET_VN_VS_CN) {
    const got = lunarToSolar(1, 1, y, false, CHINA_TIMEZONE);
    assert.ok(got, `khong tinh duoc Tet TQ ${y}`);
    assert.deepEqual([got.day, got.month], [d, m], `Tet ${y} TQ`);
  }
});

test('1985: VN nhuan thang 2, Trung Quoc nhuan thang 10 cua 1984', () => {
  assert.equal(leapMonthOf(1985, VN_TIMEZONE), 2);
  assert.equal(leapMonthOf(1984, CHINA_TIMEZONE), 10);
});

const TET_MODERN: Array<[number, number, number]> = [
  [2020, 25, 1], [2021, 12, 2], [2022, 1, 2], [2023, 22, 1], [2024, 10, 2],
  [2025, 29, 1], [2026, 17, 2], [2027, 6, 2], [2028, 26, 1],
];

test('Tet 2020-2028 khop lich in thuc te', () => {
  for (const [y, d, m] of TET_MODERN) {
    const got = lunarToSolar(1, 1, y);
    assert.deepEqual([got!.day, got!.month, got!.year], [d, m, y], `Tet ${y}`);
  }
});

test('Chuyen doi hai chieu khop nhau tren 40 nam', () => {
  for (let y = 1990; y <= 2030; y++) {
    for (const [m, d] of [[1, 15], [5, 20], [9, 3], [12, 28]] as const) {
      const l = solarToLunar(d, m, y);
      const back = lunarToSolar(l.day, l.month, l.year, l.leap);
      assert.ok(back, `${d}/${m}/${y} khong quay nguoc duoc`);
      assert.deepEqual([back.day, back.month, back.year], [d, m, y]);
    }
  }
});

test('Thang nhuan: 2023 thang 2, 2025 thang 6, 2024 khong nhuan', () => {
  assert.equal(leapMonthOf(2023), 2);
  assert.equal(leapMonthOf(2025), 6);
  assert.equal(leapMonthOf(2024), null);
});

test('Moi thang am lich chi co 29 hoac 30 ngay (1900-2100)', () => {
  for (let y = 1900; y <= 2100; y += 7) {
    for (let m = 1; m <= 12; m++) {
      const len = lunarMonthLength(m, y);
      assert.ok(len === 29 || len === 30, `thang ${m}/${y} co ${len} ngay`);
    }
  }
});

test('19 nam co dung 7 thang nhuan (chu ky Meton)', () => {
  for (const start of [1900, 1950, 2000, 2050]) {
    let leaps = 0;
    for (let y = start; y < start + 19; y++) if (leapMonthOf(y) !== null) leaps++;
    assert.equal(leaps, 7, `${start}-${start + 18} co ${leaps} thang nhuan`);
  }
});

test('KHONG BAO GIO tra ve ngay am = 0 (loi off-by-one cua ban cu)', () => {
  // 7/5/2054 va 9/4/2062: engine cu tra "0/4/2054", "0/3/2062"
  for (const [d, m, y] of [[7, 5, 2054], [9, 4, 2062]] as const) {
    const l = solarToLunar(d, m, y);
    assert.ok(l.day >= 1 && l.day <= 30, `${d}/${m}/${y} -> ngay am ${l.day}`);
  }
});

test('getDayInfo: Tet 2026 day du thong tin', () => {
  const i = getDayInfo(17, 2, 2026);
  assert.equal(i.lunar.day, 1);
  assert.equal(i.lunar.month, 1);
  assert.equal(i.canChi.year, 'Bính Ngọ');
  assert.equal(i.canChi.day, 'Nhâm Tuất');
  assert.equal(i.solar.weekday, 'Thứ Ba');
  assert.ok(i.holidays.some((h) => h.name === 'Tết Nguyên Đán'));
  assert.equal(i.luckyHours.length, 12);
});

test('getMonthGrid: 42 o, bat dau Thu Hai, du ngay trong thang', () => {
  const g = getMonthGrid(2, 2026);
  assert.equal(g.length, 42);
  assert.equal(g[0]!.solar.weekday, 'Thứ Hai');
  assert.equal(g.filter((c) => c.solar.month === 2 && c.solar.year === 2026).length, 28);
  // O chua Tet phai la mung 1
  const tet = g.find((c) => c.solar.day === 17 && c.solar.month === 2)!;
  assert.equal(tet.lunar.day, 1);
});

test('getMonthGrid lien mach: o sau hon o truoc dung 1 ngay', () => {
  const g = getMonthGrid(9, 2026);
  for (let i = 1; i < g.length; i++) assert.equal(g[i]!.jd - g[i - 1]!.jd, 1, `o ${i}`);
});
