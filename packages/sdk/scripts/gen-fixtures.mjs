/**
 * Sinh bo du lieu DOI CHIEU tu engine cu (@amlich/core, thuat toan pho bien
 * cua Ho Ngoc Duc). KHONG dung luc chay — chi dung lam ORACLE kiem thu:
 * SDK moi phai khop tren toan dai, cho nao lech thi phai CHUNG MINH ai dung.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { jdFromDate, jdToDate, solarToLunar } from '../../core/dist/index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const FROM = [1, 1, 1900];
const TO = [31, 12, 2100];

const start = jdFromDate(...FROM);
const end = jdFromDate(...TO);
const rows = [];
for (let jd = start; jd <= end; jd++) {
  const [d, m, y] = jdToDate(jd);
  const l = solarToLunar(d, m, y);
  rows.push(`${d}/${m}/${y},${l.day}/${l.month}/${l.year},${l.leap ? 1 : 0}`);
}
const out = join(__dir, '../test/fixtures/reference-1900-2100.csv');
writeFileSync(out, 'solar,lunar,leap\n' + rows.join('\n') + '\n');
console.log(`${rows.length} ngay -> ${out}`);
