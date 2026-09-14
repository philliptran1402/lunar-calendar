import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { solarToLunar } from './vn/index.js';

/**
 * TEST HOI QUY tren 73.414 ngay (1900-2100).
 *
 * File `legacy-snapshot-1900-2100.csv` la ban chup DONG BANG cua ban cai dat
 * pho bien (thuat toan Ho Ngoc Duc) — KHONG phai chuan dung, ma la moc so sanh.
 * SDK nay lech 122 ngay so voi no, va MOI truong hop lech deu da truy nguyen nhan:
 *
 *   - 1944, 1967, 2072, 2077: soc cach nua dem 2-72 giay; DeltaT cua ban cu
 *     lech 56-145s (co luc AM) day sang ngay khac. SDK nay danh dau `uncertain`.
 *   - 2054, 2062: ban cu tra ve NGAY AM = 0 (vd "0/4/2054") — loi off-by-one.
 *
 * Muc dich: neu ai sua engine lam so lech DOI KHAC 122, test do ngay —
 * buoc phai giai thich duoc vi sao, khong de lech am tham.
 */
const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../test/fixtures/legacy-snapshot-1900-2100.csv',
);

const EXPECTED_DIFFERENCES = 122;

test('Doi chieu 73.414 ngay voi ban cai dat pho bien', () => {
  const rows = readFileSync(FIXTURE, 'utf8').trim().split('\n').slice(1);
  assert.equal(rows.length, 73414, 'bo du lieu doi chieu bi thay doi');

  const diffs: string[] = [];
  for (const row of rows) {
    const [solar, lunar, leap] = row.split(',');
    const [d, m, y] = solar!.split('/').map(Number) as [number, number, number];
    const [ld, lm, ly] = lunar!.split('/').map(Number);
    const got = solarToLunar(d, m, y);
    if (got.day !== ld || got.month !== lm || got.year !== ly || got.leap !== (leap === '1')) {
      diffs.push(solar!);
    }
  }

  const agreement = ((1 - diffs.length / rows.length) * 100).toFixed(4);
  console.log(`      → khop ${rows.length - diffs.length}/${rows.length} (${agreement}%), lech ${diffs.length}`);
  assert.equal(
    diffs.length,
    EXPECTED_DIFFERENCES,
    `so ngay lech doi tu ${EXPECTED_DIFFERENCES} thanh ${diffs.length} — phai giai thich duoc nguyen nhan`,
  );
});

test('Ngay am lich LUON trong 1..30 (ban cu tung tra ve 0)', () => {
  const rows = readFileSync(FIXTURE, 'utf8').trim().split('\n').slice(1);
  for (const row of rows) {
    const [d, m, y] = row.split(',')[0]!.split('/').map(Number) as [number, number, number];
    const l = solarToLunar(d, m, y);
    assert.ok(l.day >= 1 && l.day <= 30, `${d}/${m}/${y} -> ngay am ${l.day}`);
    assert.ok(l.month >= 1 && l.month <= 12, `${d}/${m}/${y} -> thang am ${l.month}`);
  }
});

test('Cac ngay lech deu roi vao 6 doan da biet', () => {
  const rows = readFileSync(FIXTURE, 'utf8').trim().split('\n').slice(1);
  // 2073 co mat vi doan lech bat dau 9/12/2072 keo dai sang thang 1/2073.
  // So ngay tung nam: 1944:30 · 1967:30 · 2054:1 · 2062:1 · 2072:23 · 2073:7 · 2077:30
  const KNOWN_YEARS = new Set([1944, 1967, 2054, 2062, 2072, 2073, 2077]);
  for (const row of rows) {
    const [solar, lunar, leap] = row.split(',');
    const [d, m, y] = solar!.split('/').map(Number) as [number, number, number];
    const [ld, lm, ly] = lunar!.split('/').map(Number);
    const got = solarToLunar(d, m, y);
    if (got.day !== ld || got.month !== lm || got.year !== ly || got.leap !== (leap === '1')) {
      assert.ok(KNOWN_YEARS.has(y), `lech o nam KHONG nam trong danh sach da truy: ${solar}`);
    }
  }
});
