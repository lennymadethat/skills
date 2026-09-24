#!/usr/bin/env node
// book.mjs — the loop's deterministic state guard. The bookkeeper agent writes checks.json
// from the JSON the workflow hands it, then MUST run this; the workflow re-books when it
// does not print OK. Also usable as a pre-commit guard: `node scripts/book.mjs --validate checks.json`.
//
//   node scripts/book.mjs --validate checks.json [--expect N]
//     → prints "OK <count>" and exits 0 when the file is valid JSON with a checks[] array of
//       N entries (each with id/slice/title/proof/status/tries), else prints the fault, exits 1.
import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const file = argv[argv.indexOf('--validate') + 1];
const expectIx = argv.indexOf('--expect');
const expect = expectIx >= 0 ? Number(argv[expectIx + 1]) : null;
if (!file) { console.log('usage: node scripts/book.mjs --validate checks.json [--expect N]'); process.exit(1); }

let doc;
try { doc = JSON.parse(readFileSync(file, 'utf8')); }
catch (e) { console.log(`INVALID JSON: ${e.message}`); process.exit(1); }
if (!doc || !Array.isArray(doc.checks)) { console.log('INVALID: no checks[] array'); process.exit(1); }
const bad = doc.checks.filter(c => !c || typeof c.id !== 'string' || typeof c.status !== 'string' || typeof c.tries !== 'number' || !['PASS', 'FAIL', 'PARKED'].includes(c.status));
if (bad.length) { console.log(`INVALID: ${bad.length} malformed check(s)`); process.exit(1); }
if (expect != null && doc.checks.length !== expect) { console.log(`SHORT: ${doc.checks.length} of ${expect} checks`); process.exit(1); }
console.log(`OK ${doc.checks.length}`);
