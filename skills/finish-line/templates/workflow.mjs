// finish-line loop — the Workflow script that ran the first finish-line build (2026-09-07),
// generalised. Load the `workflow-authoring` skill before running. The script has NO
// filesystem or Date access: state lives in memory here and on disk through the agents.
//
// Launch with args = {
//   repo, devUrl, startedAt (ISO, from `date -u`), maxTurns, maxHours, maxTries, maxOutputTokens,
//   checkerAgentType ('Explore' or a registered read-only checker type),
//   slices: [{n, title, model:'sonnet'|'opus'}],            // from intent/plan.json
//   checksDoc: <the whole checks.json object>                // the CURRENT file, read at launch
// }
// Resume = relaunch with the CURRENT checks.json; the disk is the memory, not the run cache.
export const meta = {
  name: 'finish-line-loop',
  description: 'Build one slice at a time on dev: Sonnet/Opus builder, fresh read-only checkers per check, a bookkeeper that writes checks.json + PROGRESS.md + Telegram; park after 3 fails or one confirmed needs-a-human; stop when every check is PASS or PARKED',
  phases: [
    { title: 'Build', detail: 'one builder per slice turn (Sonnet; Opus for hard slices and third tries)' },
    { title: 'Verify', detail: 'one fresh read-only checker per open check, default FAIL' },
    { title: 'Book', detail: 'checks.json + PROGRESS.md + commit + Telegram line, validated' },
  ],
};

const REPO = args.repo, DEV = args.devUrl;
const MAX_TURNS = args.maxTurns, MAX_HOURS = args.maxHours, MAX_TRIES = args.maxTries, MAX_OUTPUT_TOKENS = args.maxOutputTokens;
const CHECKER_TYPE = args.checkerAgentType || 'Explore';
const MAX_OUTAGE_ROUNDS = 2; // a real outage gets one retry sweep; a confirmed needs-a-human parks at once
const STARTED = Date.parse(args.startedAt);
const doc = args.checksDoc; const state = doc.checks; const SLICES = args.slices;

const VERDICT = { type: 'object', properties: {
  pass: { type: 'boolean' }, evidence: { type: 'string' }, reason: { type: 'string' },
  outage: { type: 'boolean' }, human_needed: { type: 'boolean' } },
  required: ['pass', 'evidence', 'reason', 'outage', 'human_needed'] };
const BUILT = { type: 'object', properties: {
  commit: { type: 'string' }, deployed: { type: 'boolean' }, summary: { type: 'string' }, decisions: { type: 'string' },
  blocked: { type: 'boolean' }, blocked_reason: { type: 'string' }, human_needed: { type: 'boolean' } },
  required: ['commit', 'deployed', 'summary', 'decisions', 'blocked', 'blocked_reason', 'human_needed'] };
const BOOK = { type: 'object', properties: {
  now_iso: { type: 'string' }, stop_file: { type: 'boolean' }, head: { type: 'string' }, dirty: { type: 'boolean' },
  telegram_sent: { type: 'number' }, checks_count: { type: 'number' }, json_valid: { type: 'boolean' } },
  required: ['now_iso', 'stop_file', 'head', 'dirty', 'telegram_sent', 'checks_count', 'json_valid'] };

const GUARD = `Guard rails (law; hooks may not load): only \`cd ${REPO}/worker && npx wrangler deploy --env dev\` (or the repo's documented dev deploy) — never production, never \`wrangler secret\`. Only the dev branch: commit on dev, \`git push origin dev\`; never touch main. Never modify another repo (read for reference only where docs/loop-facts.md allows). Never read any secrets file. Never run a metered GPU command or spend on a metered key. Write every text file as UTF-8 (Python: encoding='utf-8'; PowerShell: -Encoding utf8; prefer the Write/Edit tools). Never ask a human anything: decide, note it in PROGRESS.md, move on; if only a human can fix it (a login, a permission), say human_needed=true with the reason.`;

const sig = () => state.map(c => c.status).join(',');
const openOf = (n) => state.filter(c => c.slice === n && c.status === 'FAIL' && c.tries < MAX_TRIES && !c.deferred);
const anyOpen = () => state.some(c => c.status === 'FAIL' && c.tries < MAX_TRIES);
const short = (s, n) => String(s || '').replace(/\s+/g, ' ').slice(0, n);

function buildPrompt(slice, open, model, turn) {
  const list = open.map(c => `- ${c.id} — ${c.title}\n    proof: ${c.proof}\n    previous failure: ${c.reason ? short(c.reason, 900) : 'none (first try)'}${c.tries ? ` (try ${c.tries + 1} of ${MAX_TRIES})` : ''}`).join('\n');
  return `You are the BUILDER for slice ${slice.n} "${slice.title}" of a finish-line loop (turn ${turn}, model ${model}). You work alone; nobody will answer a question.
Repo: ${REPO} (branch dev). Every command runs inside it (absolute paths, or start bash commands with \`cd ${REPO}\`).
Read first, in this order: docs/loop-facts.md (measured facts + guard rails — law), intent/plan.md (Slice 0 notes and your slice's row), intent/spec.md (the contract, and the rows for the checks below), CLAUDE.md, PROGRESS.md (top 60 lines — earlier builders' notes and decisions), then the code you will change. Read a file fully before editing it.

Your job this turn: make ALL of these checks pass on the dev site:
${list}

How to work: build the slice far enough that every check above is provable by a stranger; keep the locked design; prove it yourself first (curl the routes, run Playwright against the DEV site after deploying, query the database read-only) and say in your summary exactly how the checker can see each proof (URL, route, SQL, command); DDL goes through the documented migration path AND is committed as sql/; deploy dev; append ONE entry at the top of the "## Log" list in PROGRESS.md (what was built, how proven, what you decided alone and why, what is open, next — three to six plain sentences); if you changed any setting or brain to prove a check, restore it before committing; commit on dev with subject "[slice ${slice.n}] [${open.map(c => c.id).join(' ')}] <what>" and push; leave the tree clean. Never commit .loop-secrets.json or .loop-stop.
If a machine or vendor lane is down, build everything that does not need it and report blocked=true with the reason; if only a human can fix it, human_needed=true. Do not fake a proof.
${GUARD}

Return: commit (short hash or ""), deployed, summary (≤1200 chars), decisions, blocked, blocked_reason, human_needed.`;
}

function checkPrompt(c, built) {
  const note = built ? short(built.summary, 1500) : 'the builder returned nothing this turn';
  return `You are the CHECKER for check ${c.id} in a finish-line loop. Fresh context: you did not build this and you must not fix it. You have no edit or write tools on purpose; never create, change or delete a file in any repo, never commit, deploy, run wrangler secret, read a secrets file, or run a GPU command. Scratch files go under the OS temp folder only.
Check ${c.id}: "${c.title}"
Proof required by the contract: ${c.proof}
Dev site: ${DEV}. Repo (read-only reference): ${REPO} — read docs/loop-facts.md for the facts (database access, dev password, API auth, door contracts) and the ${c.id} row in intent/spec.md for the exact contract.
The builder's note — a claim, not evidence: ${note}

Produce the evidence yourself: curl the routes, run Playwright from the rig import named in docs/loop-facts.md with a short script under the OS temp folder, query the database read-only, look at a screenshot when the check is visual. Compare exactly as the proof says. Default FAIL: no evidence, no pass.
Return: pass; evidence (verbatim fragments, ≤300 chars); reason ("ok" or why it fails, precise enough for the next builder, ≤400 chars); outage (true ONLY when the failure is a machine or vendor lane being down right now — not a code fault); human_needed (true ONLY when the fault can be fixed by nobody but a human: a login, a permission, a physical action).`;
}

function bookPrompt(slice, turn, verdicts, built, passedNow, parkedNow) {
  const lines = [];
  for (const id of passedNow) { const c = state.find(x => x.id === id); lines.push(`[${slice.title}] ${id} PASS — ${short(c.title, 140)}${built && built.commit ? ` (${built.commit})` : ''}`); }
  for (const id of parkedNow) { const c = state.find(x => x.id === id); lines.push(`[${slice.title}] ${id} PARKED — ${short(c.reason, 200)}`); }
  const tg = lines.length ? lines.map(l => `   node scripts/tg.mjs ${JSON.stringify(l)}`).join('\n') : '   (none this turn)';
  const failed = verdicts.filter(v => v && v.v && !v.v.pass).map(v => v.id);
  const json = JSON.stringify(doc, null, 2);
  return `You are the BOOKKEEPER of the finish-line loop. Repo ${REPO} (branch dev). Do exactly these steps, nothing else, and never edit any other file.
1. Overwrite ${REPO}/checks.json with EXACTLY the JSON below using the Write tool, verbatim, complete to the final closing brace (it has ${state.length} entries in "checks"):
${json}
2. Validate it: run \`node scripts/book.mjs --validate checks.json --expect ${state.length}\` from ${REPO}. If it prints anything but OK, write the file again from the JSON above and validate again.
3. In ${REPO}/PROGRESS.md insert this line directly under the "## Log" heading (above the existing first bullet), with <stamp> = output of \`date -u +%Y-%m-%dT%H:%MZ\`:
- <stamp> — [loop] slice ${slice.n} turn ${turn}: passed ${passedNow.join(' ') || 'none'} · failed ${failed.join(' ') || 'none'} · parked ${parkedNow.join(' ') || 'none'}${built && built.commit ? ` · build ${built.commit}` : ' · no build commit'}${built && built.blocked ? ` · blocked: ${short(built.blocked_reason, 160)}` : ''}
4. Commit only these two files on dev and push: cd ${REPO} && git add checks.json PROGRESS.md && git commit -m "[loop] slice ${slice.n} turn ${turn}: book" && git push origin dev. "Nothing to commit" is fine.
5. Send these Telegram lines, one command each, from ${REPO}:
${tg}
6. Report: now_iso (\`date -u +%Y-%m-%dT%H:%M:%SZ\`); stop_file (does ${REPO}/.loop-stop exist); head (git rev-parse --short HEAD); dirty (\`git status --porcelain\` non-empty); telegram_sent (how many printed "tg: sent"); checks_count (the number printed by the validator); json_valid (validator said OK).`;
}

let turns = 0, sweeps = 0, stopReason = null, quietSweeps = 0, deadBuilders = 0, quietTurns = 0, lastCommit = '';
const closed = [], parked = [], hoursLog = [];
let nowIso = args.startedAt;
log(`loop start: ${state.filter(c => c.status === 'FAIL').length} FAIL, ${state.filter(c => c.status === 'PASS').length} PASS, ${state.filter(c => c.status === 'PARKED').length} PARKED`);

outer: while (anyOpen()) {
  sweeps++;
  const sweepBefore = sig();
  for (const c of state) c.deferred = false;
  for (const slice of SLICES) {
    while (true) {
      const open = openOf(slice.n);
      if (!open.length) break;
      if (turns >= MAX_TURNS) { stopReason = `max turns ${MAX_TURNS}`; break outer; }
      const hours = (Date.parse(nowIso) - STARTED) / 3.6e6;
      if (hours >= MAX_HOURS) { stopReason = `max hours ${MAX_HOURS} (elapsed ${hours.toFixed(1)})`; break outer; }
      if (budget.spent() >= MAX_OUTPUT_TOKENS) { stopReason = `output token cap ${MAX_OUTPUT_TOKENS}`; break outer; }
      turns++;
      const escalate = open.some(c => c.tries >= MAX_TRIES - 1);
      const model = (slice.model === 'opus' || escalate) ? 'opus' : 'sonnet';
      log(`turn ${turns} · slice ${slice.n} "${slice.title}" · ${open.map(c => c.id).join(' ')} · builder ${model}${escalate ? ' (last try)' : ''} · ${hours.toFixed(1)} h`);

      const built = await agent(buildPrompt(slice, open, model, turns), { label: `build:slice${slice.n}#${turns}`, phase: 'Build', model, schema: BUILT });
      if (!built) { deadBuilders++; log(`turn ${turns}: the builder returned nothing (${deadBuilders} in a row)`); if (deadBuilders >= 2) { stopReason = 'stuck: the builder died twice in a row'; break outer; } continue; }
      deadBuilders = 0;

      const verdicts = await parallel(open.map(c => () =>
        agent(checkPrompt(c, built), { label: `verify:${c.id}#${turns}`, phase: 'Verify', model: 'sonnet', agentType: CHECKER_TYPE, schema: VERDICT }).then(v => ({ id: c.id, v }))));

      const passedNow = [], parkedNow = [];
      const before = sig();
      for (const c of open) {
        const r = verdicts.find(x => x && x.id === c.id); const v = r ? r.v : null;
        if (v && v.pass) { c.status = 'PASS'; c.evidence = short(v.evidence, 300); c.reason = null; closed.push(c.id); passedNow.push(c.id); }
        else if (v && (v.human_needed || (built.human_needed && v.outage))) {
          c.status = 'PARKED'; c.reason = `needs a human: ${short(v.reason, 300)}`; c.evidence = short(v.evidence, 300); parked.push(c.id); parkedNow.push(c.id);
        } else if (v && v.outage) {
          c.outage_rounds = (c.outage_rounds || 0) + 1; c.deferred = true; c.reason = short(v.reason, 400);
          if (c.outage_rounds >= MAX_OUTAGE_ROUNDS) { c.status = 'PARKED'; c.reason = `offline on ${MAX_OUTAGE_ROUNDS} rounds: ${short(v.reason, 300)}`; parked.push(c.id); parkedNow.push(c.id); }
        } else {
          c.tries++; c.reason = v ? short(v.reason, 400) : 'the checker returned nothing'; if (v) c.evidence = short(v.evidence, 300);
          if (c.tries >= MAX_TRIES) { c.status = 'PARKED'; parked.push(c.id); parkedNow.push(c.id); }
        }
      }
      const changed = sig() !== before;
      const newCommit = built.commit && built.commit !== lastCommit; lastCommit = built.commit || lastCommit;
      quietTurns = (changed || newCommit) ? 0 : quietTurns + 1;

      let book = await agent(bookPrompt(slice, turns, verdicts, built, passedNow, parkedNow), { label: `book:slice${slice.n}#${turns}`, phase: 'Book', model: 'haiku', schema: BOOK });
      if (book && (!book.json_valid || book.checks_count !== state.length)) {
        log(`turn ${turns}: checks.json invalid or short (${book.checks_count}/${state.length}); booking again`);
        book = await agent(bookPrompt(slice, turns, verdicts, built, [], []) + '\nThe previous attempt wrote an invalid or truncated file. Write the COMPLETE JSON this time and skip the Telegram step.', { label: `rebook:slice${slice.n}#${turns}`, phase: 'Book', model: 'sonnet', schema: BOOK });
      }
      if (book) { nowIso = book.now_iso || nowIso; hoursLog.push({ turn: turns, now: nowIso, head: book.head, tg: book.telegram_sent, dirty: book.dirty }); if (book.stop_file) { stopReason = '.loop-stop present'; break outer; } }
      log(`turn ${turns} done: PASS ${passedNow.join(' ') || '-'} · PARKED ${parkedNow.join(' ') || '-'} · deferred ${open.filter(c => c.deferred).map(c => c.id).join(' ') || '-'} · tokens ${Math.round(budget.spent() / 1000)}k`);
      if (quietTurns >= 2) { stopReason = 'stuck: two turns with no status change and no new commit'; break outer; }
    }
  }
  quietSweeps = sig() === sweepBefore ? quietSweeps + 1 : 0;
  if (quietSweeps >= 2) { stopReason = 'stuck: two full sweeps with no change'; break; }
}

const remaining = state.filter(c => c.status === 'FAIL').length;
const summary = { turns, sweeps, stopReason, closed, parked, remaining, done: remaining === 0, lastNow: nowIso,
  passCount: state.filter(c => c.status === 'PASS').length, parkedCount: state.filter(c => c.status === 'PARKED').length,
  parkedReasons: state.filter(c => c.status === 'PARKED').map(c => `${c.id}: ${short(c.reason, 300)}`), outputTokens: budget.spent(), hoursLog };
log(`loop end: ${summary.passCount} PASS, ${summary.parkedCount} PARKED, ${remaining} FAIL · ${turns} turns · ${stopReason || 'every check closed'}`);
return summary;
