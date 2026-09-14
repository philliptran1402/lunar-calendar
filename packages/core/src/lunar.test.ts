import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canChiDay, canChiYear, conGiapYear, dayQuality, luckyHours } from './canchi.js';
import { jdFromDate, jdToDate } from './julian.js';
import { getLeapMonth, lunarMonthLength, lunarToSolar, solarToLunar } from './lunar.js';
import { getDayInfo, getMonthGrid } from './almanac.js';

/**
 * Cach duy nhat chung minh thuat toan dung: doi chieu voi NGAY TET THAT
 * — thu da xay ra, ai cung kiem chung duoc.
 */
const TET: Array<[year: number, dd: number, mm: number, canChi: string]> = [
  [2020, 25, 1, 'Canh Tý'],
  [2021, 12, 2, 'Tân Sửu'],
  [2022, 1, 2, 'Nhâm Dần'],
  [2023, 22, 1, 'Quý Mão'],
  [2024, 10, 2, 'Giáp Thìn'],
  [2025, 29, 1, 'Ất Tỵ'],
  [2026, 17, 2, 'Bính Ngọ'],
  [2027, 6, 2, 'Đinh Mùi'],
  [2028, 26, 1, 'Mậu Thân'],
];

test('Tet Nguyen Dan: am 1/1 -> dung ngay duong that', () => {
  for (const [year, dd, mm, cc] of TET) {
    const solar = lunarToSolar(1, 1, year);
    assert.ok(solar, `khong doi duoc Tet ${year}`);
    assert.deepEqual(
      { d: solar.day, m: solar.month, y: solar.year },
      { d: dd, m: mm, y: year },
      `Tet ${year} sai`,
    );
    assert.equal(canChiYear(year), cc, `can chi nam ${year} sai`);
  }
});

test('Chieu nguoc lai: ngay duong cua Tet -> am 1/1', () => {
  for (const [year, dd, mm] of TET) {
    const lunar = solarToLunar(dd, mm, year);
    assert.deepEqual(
      { d: lunar.day, m: lunar.month, y: lunar.year, leap: lunar.leap },
      { d: 1, m: 1, y: year, leap: false },
      `nghich dao Tet ${year} sai`,
    );
  }
});

test('Thang nhuan: 2023 nhuan thang 2, 2025 nhuan thang 6, 2024 khong nhuan', () => {
  assert.equal(getLeapMonth(2023), 2);
  assert.equal(getLeapMonth(2025), 6);
  assert.equal(getLeapMonth(2024), null);
});

test('Ngay trong thang nhuan 2023 phai duoc danh dau leap', () => {
  // 22/3/2023 duong = 1/2 nhuan am lich
  const l = solarToLunar(22, 3, 2023);
  assert.equal(l.month, 2);
  assert.equal(l.leap, true);
  // va doi nguoc lai phai ra dung ngay do
  const back = lunarToSolar(1, 2, 2023, true);
  assert.deepEqual(back, { day: 22, month: 3, year: 2023 });
});

test('Thang nhuan khong ton tai -> tra ve null, khong doan bua', () => {
  assert.equal(lunarToSolar(1, 5, 2024, true), null); // 2024 khong nhuan
  assert.equal(lunarToSolar(1, 3, 2023, true), null); // 2023 nhuan thang 2, khong phai 3
});

test('Trung Thu 15/8 am lich 2025 = 6/10/2025 duong', () => {
  assert.deepEqual(lunarToSolar(15, 8, 2025), { day: 6, month: 10, year: 2025 });
});

test('Giong to Hung Vuong 10/3 am 2026 = 26/4/2026 duong', () => {
  const s = lunarToSolar(10, 3, 2026);
  const back = solarToLunar(s!.day, s!.month, s!.year);
  assert.deepEqual({ d: back.day, m: back.month }, { d: 10, m: 3 });
});

test('Julian day: di va ve khong mat mat', () => {
  for (const [d, m, y] of [[1, 1, 1900], [29, 2, 2024], [31, 12, 2099], [15, 10, 1582]] as const) {
    assert.deepEqual(jdToDate(jdFromDate(d, m, y)), [d, m, y]);
  }
});

test('Thang am lich chi co 29 hoac 30 ngay', () => {
  for (let m = 1; m <= 12; m++) {
    const len = lunarMonthLength(m, 2026);
    assert.ok(len === 29 || len === 30, `thang ${m}/2026 co ${len} ngay`);
  }
});

test('Can chi ngay chay dung chu ky 60', () => {
  const jd = jdFromDate(1, 1, 2026);
  assert.equal(canChiDay(jd), canChiDay(jd + 60));
  assert.notEqual(canChiDay(jd), canChiDay(jd + 1));
});

test('Con giap: 2026 = Binh Ngo -> nam con Ngua', () => {
  assert.equal(conGiapYear(2026), 'Ngựa');
  assert.equal(conGiapYear(2024), 'Rồng');
});

test('Gio hoang dao: du 12 gio, co ca tot va xau', () => {
  const hours = luckyHours(jdFromDate(17, 2, 2026));
  assert.equal(hours.length, 12);
  assert.ok(hours.some((h) => h.auspicious));
  assert.ok(hours.some((h) => !h.auspicious));
  assert.equal(hours[0]!.chi, 'Tý');
  assert.equal(hours[0]!.range, '23:00 – 00:59');
});

test('Truc than: luon nam trong 12 sao', () => {
  const q = dayQuality(jdFromDate(17, 2, 2026), 1);
  assert.ok(q.star.length > 0);
  assert.equal(typeof q.auspicious, 'boolean');
});

test('getDayInfo: Tet 2026 co day du thong tin', () => {
  const info = getDayInfo(17, 2, 2026);
  assert.equal(info.lunar.day, 1);
  assert.equal(info.lunar.month, 1);
  assert.equal(info.canChi.year, 'Bính Ngọ');
  assert.ok(info.holidays.some((h) => h.name === 'Tết Nguyên Đán'));
  assert.equal(info.solar.weekday, 'Thứ Ba');
});

test('Luoi thang: 42 o, tuan bat dau Thu Hai, chua du ngay cua thang', () => {
  const grid = getMonthGrid(2, 2026);
  assert.equal(grid.length, 42);
  assert.equal(grid[0]!.solar.weekday, 'Thứ Hai');
  const inMonth = grid.filter((c) => c.solar.month === 2 && c.solar.year === 2026);
  assert.equal(inMonth.length, 28); // thang 2/2026 co 28 ngay
});
