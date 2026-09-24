#!/usr/bin/env node
// fix-encoding.mjs — repair a UTF-8 text file that was re-saved through a Windows-1252
// default (every "—" became "â€”", every "·" became "Â·"), and strip a UTF-8 BOM.
// Only lines carrying the mojibake markers are touched, and only when the reversal
// (cp1252 bytes → UTF-8) round-trips cleanly. Writes to a temp file, validates, swaps.
// usage: node scripts/fix-encoding.mjs <file> [more files]   (exit 0; prints what changed)
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const MARK = /â€|Â|Ã/;
// Windows-1252 code points for bytes 0x80–0x9F (the rest map 1:1 to Latin-1).
const CP1252_HIGH = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91,
  0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98,
  0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};
function toCp1252(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80 || (cp >= 0xA0 && cp <= 0xFF)) out.push(cp);
    else if (CP1252_HIGH[cp] !== undefined) out.push(CP1252_HIGH[cp]);
    // 0x81 0x8D 0x8F 0x90 0x9D are undefined in cp1252; decoders pass them through as C1
    // controls (a curly ” is E2 80 9D, so its last byte surfaces as U+009D) — map them back.
    else if (cp === 0x81 || cp === 0x8D || cp === 0x8F || cp === 0x90 || cp === 0x9D) out.push(cp);
    else return null; // not representable → not a cp1252 round-trip
  }
  return Buffer.from(out);
}
function repairLine(line) {
  if (!MARK.test(line)) return line;
  const bytes = toCp1252(line);
  if (!bytes) return line;
  try {
    const dec = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return MARK.test(dec) ? repairLine(dec) : dec; // handles a double double-encoding too
  } catch { return line; }
}

let changedFiles = 0;
for (const file of process.argv.slice(2)) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  const hadBom = text.charCodeAt(0) === 0xFEFF;
  if (hadBom) text = text.slice(1);
  const lines = text.split('\n');
  let fixed = 0;
  const out = lines.map(l => { const r = repairLine(l); if (r !== l) fixed++; return r; });
  if (!fixed && !hadBom) continue;
  const result = out.join('\n');
  if (result.split('\n').length !== lines.length) { console.error(`fix-encoding: refused ${file} (line count changed)`); continue; }
  const tmp = file + '.enc.tmp';
  writeFileSync(tmp, result, { encoding: 'utf8' });
  renameSync(tmp, file);
  changedFiles++;
  console.log(`fix-encoding: ${file} — ${fixed} line(s) repaired${hadBom ? ', BOM removed' : ''}`);
}
process.exit(0);
