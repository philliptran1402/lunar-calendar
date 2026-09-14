import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHINA_TIMEZONE, VN_TIMEZONE, getDayInfo, getMonthGrid, leapMonthOf, lunarMonthLength, lunarToSolar, solarToLunar } from './vn/index.js';

/**
 * THE ACID TEST: the years Vietnam celebrated Tết on a DIFFERENT day from China.
 * The only difference is the meridian the calendar is computed on
 * (Vietnam 105°E = UTC+7, China 120°E = UTC+8). An implementation that handles
 * the timezone AND the leap-month rule correctly must reproduce all six
 * historical cases. Sources: Hoàng Xuân Hãn, Nhân Dân, RFA.
 */
const TET_VN_VS_CN: Array<[year: number, vn: [number, number], cn: [number, number]]> = [
  [1968, [29, 1], [30, 1]],
  [1969, [16, 2], [17, 2]],
  [1985, [21, 1], [20, 2]], // a FULL MONTH apart — the leap month lands differently
  [2007, [17, 2], [18, 2]],
  [2030, [2, 2], [3, 2]],
  [2053, [18, 2], [19, 2]],
];

test('Vietnamese Tết (UTC+7) is right for every historical year', () => {
  for (const [y, [d, m]] of TET_VN_VS_CN) {
    const got = lunarToSolar(1, 1, y, false, VN_TIMEZONE);
    assert.ok(got, `could not compute Tết ${y}`);
    assert.deepEqual([got.day, got.month], [d, m], `Tết ${y} VN`);
  }
});

test('the same algorithm on UTC+8 yields the Chinese New Year dates', () => {
  for (const [y, , [d, m]] of TET_VN_VS_CN) {
    const got = lunarToSolar(1, 1, y, false, CHINA_TIMEZONE);
    assert.ok(got, `could not compute Chinese New Year ${y}`);
    assert.deepEqual([got.day, got.month], [d, m], `Chinese New Year ${y}`);
  }
});

test('1985: Vietnam leaps month 2, China leaps month 10 of 1984', () => {
  assert.equal(leapMonthOf(1985, VN_TIMEZONE), 2);
  assert.equal(leapMonthOf(1984, CHINA_TIMEZONE), 10);
});

const TET_MODERN: Array<[number, number, number]> = [
  [2020, 25, 1], [2021, 12, 2], [2022, 1, 2], [2023, 22, 1], [2024, 10, 2],
  [2025, 29, 1], [2026, 17, 2], [2027, 6, 2], [2028, 26, 1],
];

test('Tết 2020-2028 matches printed calendars', () => {
  for (const [y, d, m] of TET_MODERN) {
    const got = lunarToSolar(1, 1, y);
    assert.deepEqual([got!.day, got!.month, got!.year], [d, m, y], `Tết ${y}`);
  }
});

test('solar↔lunar conversion round-trips over 40 years', () => {
  for (let y = 1990; y <= 2030; y++) {
    for (const [m, d] of [[1, 15], [5, 20], [9, 3], [12, 28]] as const) {
      const l = solarToLunar(d, m, y);
      const back = lunarToSolar(l.day, l.month, l.year, l.leap);
      assert.ok(back, `${d}/${m}/${y} did not convert back`);
      assert.deepEqual([back.day, back.month, back.year], [d, m, y]);
    }
  }
});

test('leap months: 2023 leaps 2, 2025 leaps 6, 2024 has none', () => {
  assert.equal(leapMonthOf(2023), 2);
  assert.equal(leapMonthOf(2025), 6);
  assert.equal(leapMonthOf(2024), null);
});

test('every lunar month has 29 or 30 days (1900-2100)', () => {
  for (let y = 1900; y <= 2100; y += 7) {
    for (let m = 1; m <= 12; m++) {
      const len = lunarMonthLength(m, y);
      assert.ok(len === 29 || len === 30, `month ${m}/${y} has ${len} days`);
    }
  }
});

test('19 years hold exactly 7 leap months (the Metonic cycle)', () => {
  for (const start of [1900, 1950, 2000, 2050]) {
    let leaps = 0;
    for (let y = start; y < start + 19; y++) if (leapMonthOf(y) !== null) leaps++;
    assert.equal(leaps, 7, `${start}-${start + 18} has ${leaps} leap months`);
  }
});

test('NEVER returns lunar day 0 (the off-by-one bug of the older port)', () => {
  // On 7/5/2054 and 9/4/2062 the old engine returned "0/4/2054" and "0/3/2062"
  for (const [d, m, y] of [[7, 5, 2054], [9, 4, 2062]] as const) {
    const l = solarToLunar(d, m, y);
    assert.ok(l.day >= 1 && l.day <= 30, `${d}/${m}/${y} -> lunar day ${l.day}`);
  }
});

test('getDayInfo returns complete information for Tết 2026', () => {
  const i = getDayInfo(17, 2, 2026);
  assert.equal(i.lunar.day, 1);
  assert.equal(i.lunar.month, 1);
  assert.equal(i.canChi.year, 'Bính Ngọ');
  assert.equal(i.canChi.day, 'Nhâm Tuất');
  assert.equal(i.solar.weekday, 'Thứ Ba');
  assert.ok(i.holidays.some((h) => h.name === 'Tết Nguyên Đán'));
  assert.equal(i.luckyHours.length, 12);
});

test('getMonthGrid: 42 cells, starting Monday, all days of the month present', () => {
  const g = getMonthGrid(2, 2026);
  assert.equal(g.length, 42);
  assert.equal(g[0]!.solar.weekday, 'Thứ Hai');
  assert.equal(g.filter((c) => c.solar.month === 2 && c.solar.year === 2026).length, 28);
  // The cell holding Tết must be the first of the lunar month
  const tet = g.find((c) => c.solar.day === 17 && c.solar.month === 2)!;
  assert.equal(tet.lunar.day, 1);
});

test('getMonthGrid is contiguous: each cell is exactly one day after the last', () => {
  const g = getMonthGrid(9, 2026);
  for (let i = 1; i < g.length; i++) assert.equal(g[i]!.jd - g[i - 1]!.jd, 1, `cell ${i}`);
});
