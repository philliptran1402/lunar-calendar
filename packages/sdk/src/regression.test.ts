import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { solarToLunar } from './vn/index.js';

/**
 * REGRESSION TEST over 73,414 days (1900-2100).
 *
 * `legacy-snapshot-1900-2100.csv` is a FROZEN snapshot of the widely used port
 * (the Hồ Ngọc Đức algorithm). It is NOT a source of truth — it is a baseline
 * to compare against. This SDK differs from it on 122 days, and every one of
 * those has been traced:
 *
 *   - 1944, 1967, 2072, 2077: the conjunction falls 2-72 s from midnight, and
 *     the old port's ΔT is off by 56-145 s (sometimes NEGATIVE), pushing it
 *     onto the other day. This SDK flags these days `uncertain`.
 *   - 2054, 2062: the old port returns LUNAR DAY 0 (e.g. "0/4/2054") — an
 *     outright off-by-one bug.
 *
 * The point: if a change to the engine moves the count away from 122, this
 * test fails immediately and the difference has to be explained rather than
 * drifting in unnoticed.
 */
const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../test/fixtures/legacy-snapshot-1900-2100.csv',
);

const EXPECTED_DIFFERENCES = 122;

test('cross-check 73,414 days against the widely used port', () => {
  const rows = readFileSync(FIXTURE, 'utf8').trim().split('\n').slice(1);
  assert.equal(rows.length, 73414, 'the comparison fixture has changed');

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
  console.log(`      → agree on ${rows.length - diffs.length}/${rows.length} (${agreement}%), differ on ${diffs.length}`);
  assert.equal(
    diffs.length,
    EXPECTED_DIFFERENCES,
    `the number of differing days moved from ${EXPECTED_DIFFERENCES} to ${diffs.length} — the cause must be explained`,
  );
});

test('the lunar day is ALWAYS within 1..30 (the old port returned 0)', () => {
  const rows = readFileSync(FIXTURE, 'utf8').trim().split('\n').slice(1);
  for (const row of rows) {
    const [d, m, y] = row.split(',')[0]!.split('/').map(Number) as [number, number, number];
    const l = solarToLunar(d, m, y);
    assert.ok(l.day >= 1 && l.day <= 30, `${d}/${m}/${y} -> lunar day ${l.day}`);
    assert.ok(l.month >= 1 && l.month <= 12, `${d}/${m}/${y} -> lunar month ${l.month}`);
  }
});

test('every differing day falls in one of the six traced runs', () => {
  const rows = readFileSync(FIXTURE, 'utf8').trim().split('\n').slice(1);
  // 2073 appears because the run starting 9/12/2072 spills over into Jan 2073.
  // Days per year: 1944:30 · 1967:30 · 2054:1 · 2062:1 · 2072:23 · 2073:7 · 2077:30
  const KNOWN_YEARS = new Set([1944, 1967, 2054, 2062, 2072, 2073, 2077]);
  for (const row of rows) {
    const [solar, lunar, leap] = row.split(',');
    const [d, m, y] = solar!.split('/').map(Number) as [number, number, number];
    const [ld, lm, ly] = lunar!.split('/').map(Number);
    const got = solarToLunar(d, m, y);
    if (got.day !== ld || got.month !== lm || got.year !== ly || got.leap !== (leap === '1')) {
      assert.ok(KNOWN_YEARS.has(y), `difference in a year that is NOT on the traced list: ${solar}`);
    }
  }
});
