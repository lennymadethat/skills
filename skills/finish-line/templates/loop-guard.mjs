#!/usr/bin/env node
// finish-line loop guard — a PreToolUse hook for Bash. Reads the tool call from
// stdin, exits 2 (block) with a reason when the command would leave the lane:
// a production deploy, another repo, a secret, a GPU operation, a push to main.
// Guard rails live here, not in prose. Edit ALLOW_DIRS per project.
import fs from 'node:fs';
const ALLOW_DIRS = [process.env.LOOP_REPO || process.cwd()].map(p => p.replace(/\\/g, '/').toLowerCase());
let input = '';
try { input = fs.readFileSync(0, 'utf8'); } catch {}
let cmd = '';
try { const j = JSON.parse(input); cmd = String(j?.tool_input?.command || ''); } catch { cmd = input; }
const c = cmd.replace(/\\/g, '/');
const block = (why) => { process.stderr.write(`loop-guard: blocked — ${why}\n`); process.exit(2); };
if (/wrangler\s+deploy(?!.*--env\s+dev)/.test(c) && !/--env\s+dev/.test(c)) block('production deploy (only `wrangler deploy --env dev` is allowed)');
if (/wrangler\s+(secret|pages\s+deploy)/.test(c)) block('secrets and Pages deploys are human-only');
if (/git\s+push\b(?!.*\bdev\b)/.test(c) || /git\s+(checkout|switch)\s+main\b/.test(c) || /git\s+merge\b/.test(c)) block('only the dev branch moves; main is the owner\'s');
if (/GPU_API_KEY|SALAD_API_KEY|RUNPOD_API_KEY|api\.salad\.com|api\.runpod\.io/.test(c)) block('metered GPU operations are human-only');
if (/\.env\.master|secrets/.test(c)) block('no secrets in a build loop; read them by name from the worker env');
const dirs = [...c.matchAll(/(?:cd|pushd)\s+["']?([A-Za-z]:\/[^"'\s&|;]+)/g)].map(m => m[1].toLowerCase());
for (const d of dirs) if (!ALLOW_DIRS.some(a => d.startsWith(a))) block(`another repo: ${d}`);
process.exit(0);
