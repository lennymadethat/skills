---
name: finish-line
description: Finish a build on its own, end to end, with one human walkthrough at the end. Three phases in one skill — (1) a checkpointed grill-me interview that fills intent.md as the owner answers, (2) a spec (the acceptance contract, every check default-FAIL) and a plan (ordered slices, each with its proof) that the owner reads and corrects, (3) a resumable Workflow loop that builds one slice at a time with a cheap builder, verifies it with a fresh-context checker that has no write tools, commits, deploys dev, and stops itself when every check passes. Use when the user says "/finish-line", "finish this yourself", "run the loop on X", "set up a loop for X", "grill me about X", or wants a build completed without them in the loop.
---

# /finish-line — interview, contract, loop

Born 2026-09-06. The owner: *"complete it yourself in every single corner for as long as it takes without any interjection, without draining my tokens, using multiple models, every click works, ready for a final walkthrough by a human."* The reason a loop works is not the loop — it is (a) a finish line written as proofs a machine can check, (b) memory that lives in the repo so no run depends on a context window, and (c) a checker that never saw the build. This skill recreates those three on demand.

Sources folded in: Anthropic's long-running-agent harness (initializer + progress file + fresh-context evaluator, default FAIL), the AI-native SDLC (intent → spec → plan, each self-contained), frontier-model prompting (tell it what done looks like, match effort, make it prove work, delegate), Matt Pocock's grill-me (one question at a time, read the codebase before asking) with Nate Herk's checkpointing (write the doc back after every answer).

## Standing rules
- **The orchestrator only orchestrates.** Builders and checkers are subagents with `model` set on EVERY call (Sonnet default, Opus for hard slices, never unset: unset means the orchestrator's own model and a burned quota).
- **Agents are not confined:** a spec describes outputs as starting points, never "the one number".
- **Name the rule and its cost** when something stops you. Ask before any spend the owner did not pre-approve (metered GPU, paid APIs); everything else inside an allowlist is acted on.
- **Dev only.** Never prod, never another repo, never a secret in a bundle. Enforced by hooks, not prose.

## Phase 1 — the interview (grill me, checkpointed)
Goal: `intent/intent.md` complete enough that a stranger could write the spec from it.
1. Create `intent/intent.md` from `templates/intent.md` before the first question. It has four sections: **Why** (the owner's words), **Decisions** (numbered, dated), **Q&A log**, **Open flags**.
2. Ask **one question per turn** with `AskUserQuestion`, 2–4 concrete options that a real answer would pick (never Yes/No unless binary), the recommended one first. Never ask what the codebase or your notes can answer — read them first and ask a sharper question ("the bridge's ask door has no effort flag; do we add it or skip effort?").
3. **After every answer, write back to intent.md**: the decision in one sentence, the Q&A line, any new open flag. This is the checkpoint — a closed laptop or a full context loses nothing.
4. If the owner answers "I don't understand the question", rewrite it as a concrete scenario ("you type X, what happens?") with two options. Never repeat the same wording.
5. Stop when there are no open flags and no contradictions, or when the user says enough. Then read intent.md back to them in ten lines.

## Phase 2 — the contract and the plan
1. **`intent/spec.md`** from `templates/spec.md`: what exists (screens, routes, agents, data), the **acceptance checks** (each: id, one sentence, how a machine proves it, default FAIL), out of scope, never. Every number on a screen names its truth source. Every click names its handler and its test.
2. **`intent/plan.md`** from `templates/plan.md`: slices in order, each with files, model rung, risk, and its proof. A slice is 30–90 minutes of a builder's work. Slice 0 is anything done BY HAND with the owner before the loop (a foreign repo, a secret, a design call).
3. **`PROGRESS.md`** + **`checks.json`** (from templates) — the loop's memory. `checks.json` = every acceptance check with `status:"FAIL"`, `tries:0`, `slice`, `evidence:null`.
4. **`.claude/settings.json` hooks + `scripts/loop-guard.mjs`** from templates: block prod deploys, other repos, secrets, GPU ops. `.loop-stop` in the repo root is the kill switch.
4b. **Measure before the loop: `docs/loop-facts.md`.** The orchestrator verifies every fact a builder will need against the live machines (door contracts and their exact reply shapes, provider ids, auth headers, database access, the API routes' line numbers, chat ids, dev password) and writes them with the guard rails as law. The first run caught a wrong provider id this way; a builder would have sent every agent to the wrong model.
4c. **Install the mechanical guards from templates:** `scripts/fix-encoding.mjs`, `scripts/book.mjs`, `scripts/tg.mjs` into the repo; `templates/pre-commit` into `.git/hooks/pre-commit` (chmod +x); a gitignored `.loop-secrets.json` with the bot token + chat id (you write it once by hand; no agent ever reads the secrets file). Rules in prose do not survive fresh contexts; hooks do.
5. **the owner reads spec.md and plan.md and corrects them.** This is the human's real work and the only gate before the loop. Commit all of it on `dev`.

## Phase 3 — the loop
Run `templates/workflow.mjs` through the Workflow tool (load `workflow-authoring` first; the user opted in by asking for the loop). Pass `args` = {repo, devUrl, startedAt (from `date -u`), maxTurns, maxHours, maxTries, maxOutputTokens, checkerAgentType ('Explore' or the registered read-only `plh-checker`), slices (from plan.json), checksDoc (the CURRENT checks.json, read at launch)}. The script has no filesystem: state lives in memory and reaches disk through the bookkeeper; a relaunch reads the current checks.json again, so the disk is the memory and the run cache is not needed. One turn:
1. Read `checks.json`; pick the first `FAIL` with `tries < 3`, grouped by slice in plan order.
2. **Builder** (`agent(...,{model: slice.model || 'sonnet'})`): gets the slice text, the check, the repo path, the brand block, and PROGRESS.md's last 20 lines. Builds, runs the repo's own tests, deploys dev, writes a 5-line note to PROGRESS.md, commits with `[slice N] [check id]` in the subject.
3. **Checker** (`agent(...,{model:'sonnet', agentType:'Explore'})` — the built-in read-only type has Bash + database tools and no Edit/Write; `plh-checker` in `~/.claude/agents/` is the same with a checker persona, available in sessions started after it was written): fresh context, one per open check in parallel, must open the page / call the route / query the DB, returns `{pass, evidence, reason, outage, human_needed}`. **Default FAIL**: no evidence, no pass. `human_needed` (a login, a permission, a physical act) parks the check at once; `outage` (a machine down right now) defers it one sweep, then parks.
4. **Bookkeeper** (Haiku): writes checks.json from the JSON the script hands it, runs `node scripts/book.mjs --validate checks.json --expect N`, inserts the PROGRESS.md line, commits, sends one Telegram line per closed check via `scripts/tg.mjs`, reports `{now_iso, stop_file, head, dirty, telegram_sent, checks_count, json_valid}`. The script re-books on Sonnet when the count or validity is wrong (a Haiku bookkeeper truncated the file once in 17 turns on the first run). Pass → `PASS` + evidence (≤300 chars). Fail → `tries+1` + reason (≤400). Three fails → `PARKED`; the third try's builder is escalated to Opus.
5. Brakes (all mechanical): two full passes with no change to checks.json → stop, post "stuck" with the parked list; `MAX_TURNS` (120) and `MAX_HOURS` (36) → stop and report; `.loop-stop` present → stop before the next slice; token count per slice logged to PROGRESS.md, `MAX_OUTPUT_TOKENS` → stop.
6. All PASS (parked allowed) → **close-out by the orchestrator**: verify checks.json against the last booking commit (restore from git if the last bookkeeper damaged it), re-verify anything parked on a calendar clause, reset any brain/setting a test changed, sweep leftover processes (`node` processes running `*mcp*` servers from finished agents, and headless browsers), deploy dev one last time, write your project notes (a loop-ran section, current state, the lessons), post "ready for walkthrough" with the parked list, stop the heartbeat.

**Keep-alive:** a `/loop` heartbeat (dynamic, 25 min) that checks the workflow is alive (journal mtime, PROGRESS.md tail, git log), writes ONE as-we-go line to the project notes per tick, and relaunches the Workflow with the CURRENT checks.json if the run died; ends when `.loop-stop` exists or every check is PASS/PARKED. The heartbeat is the only orchestrator spend during the loop; keep each tick to one Bash read and one notes line.

**Model rungs:** builder Sonnet 5 (default), Opus 5 for slices marked `hard`, checker Sonnet 5, the orchestrator reads verdicts only. Effort medium on both. Never the orchestrator's model inside `agent()`.

## The start prompt (paste into a fresh session; also saved as `docs/loop-start.md` in the repo)
> Open `<repo>`. Read `intent/intent.md`, `intent/spec.md`, `intent/plan.md`, `PROGRESS.md`, `checks.json`. Run `/finish-line` phase 3 on this repo until every check in checks.json is PASS or PARKED. Builders on Sonnet, hard slices on Opus, checker on Sonnet with no write tools. Dev only. One Telegram line per closed check. Stop and post "ready for walkthrough" when done, or "stuck" with reasons. Never ask me anything; park it instead.

## Close
When the loop ends: the project notes get a "loop ran" entry (slices closed, parked with reasons, spend), current state updated, and the walkthrough list for the owner (parked items + anything the spec marked human-only).

## Lessons from the first run (2026-09-07 — 30/32 checks, 14 slices, 69 agents, 11.7 h)
Apply these before the next run:
1. **Bookkeeping by script, never by a model.** The Haiku bookkeeper truncated `checks.json` on turn 17 and the workflow died on its missing structured output. Have the workflow hand the JSON to a deterministic writer (`node scripts/book.mjs`) and validate JSON in a pre-commit hook. (The Workflow script itself has no filesystem access, so the writer is a tiny agent-run command, not the script.)
2. **A `needs a human` fault parks after ONE confirmed diagnosis.** An outage rule that retries a signed-out CLI wastes rounds. Checker verdicts should carry `human_needed` separately from `outage`.
3. **Word every check so it can be true on build day.** "Yesterday's row written by the cron" cannot pass on the cron's birthday; say "a cron-written row with provenance exists". Give builders a way to prove authorship (provenance columns).
4. **Encoding hook, not encoding prose.** Two builders re-saved PROGRESS.md through Windows-1252 despite a written rule. Install `scripts/fix-encoding.mjs` + a local `.git/hooks/pre-commit` on the memory files as part of phase 2.
5. **Sweep processes at close-out.** Each agent that loads an MCP tool leaves its server running (21 database MCP pairs and 0.7 GB RAM free, on the first run). Prefer shell/curl for the database inside a loop; kill `*mcp*` node orphans when the loop ends.
6. **Reset test residue in the same turn.** A vendor test left two agents on another provider for hours. Any builder that changes a brain or setting to prove a check restores it before committing.
7. **What worked, keep:** facts measured before turn 1 (`docs/loop-facts.md`); checkers as the read-only `Explore` agent type; Opus escalation on the third try; the orchestrator's 25-min heartbeat writing one notes line per tick; the gitignored `.loop-secrets.json` + `scripts/tg.mjs` for Telegram; every `agent()` with `model` set.
