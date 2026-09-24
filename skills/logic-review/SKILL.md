---
name: logic-review
description: Audit a build against what it is FOR, by forcing four layers to agree — the purpose, the story we tell about it, the code, and the data it actually produced. Use when the user says "/logic-review <build>", "logic review", "logic meter", "is this actually doing what we think", "check the build against the concept", "prove this description is true", or when a system has been running for weeks/months and nobody has verified it does the job rather than merely running without errors. Also run it before believing ANY paragraph (mine or the docs') that explains how a machine works.
---

# Logic Review — make the purpose, the story, the code and the data agree

Born 2026-08-28, from a fault that had been silently eating the product for months.

The owner asked why one newsletter author showed ten quiet days. The answer was not a bug in the ordinary
sense. A newsletter reader's whole ingest lane was built around `nr_catalog.latest_post_url` — **one
column holding one URL**. The catalogue could only ever remember an author's newest post, so
anything published between two visits had nowhere to be recorded and vanished with no error,
no log, and no trace. Measured afterwards: **524 of 875 authors (60%) had a known latest post
that was never ingested.** Left alone one more week, half the members would not have received
the newsletters they subscribed to.

Every safeguard agreed that things were fine:

- **The code comment** promised a "FOREVER-REFRESH GUARANTEE — every catalog row is
  freshness-checked on a ≤48h cycle." Completely true. And not coverage.
- **The function names** — `ingestFresh`, `voiceFresh`, `refreshCatalogMeta` — all said the
  system was keeping things current, which sounds like keeping things complete.
- **The guard suite ran green**: `store-promise — all 815 listed pages have something
  playable`. It asked whether a page had *something*. It never asked whether it had *everything*.
- **The model's own explanation of the machine** described a system that captures every edition,
  because that is what the code's self-description implies. Confidently wrong.

Nothing surfaced it until an external source of truth (the author's public RSS feed) was diffed
against the database: the feed listed 12 recent editions, we held 5.

**The lesson this skill exists to institutionalise: a description of a system is worthless until
it has been falsified against the data. Reading the code is not enough, because the code is
written in the vocabulary of its own assumptions.**

---

## The four layers

A logic review holds four things next to each other. Findings live in the *disagreements*.

| Layer | What it is | Where it comes from |
|---|---|---|
| **PURPOSE** | What the build is FOR, in the owner's words | project notes, their own words, the product promise |
| **STORY** | What we say it does | README/CLAUDE.md, code comments, notes, the model's explanations |
| **CODE** | What it is written to do | the actual implementation |
| **DATA** | What it actually produced | the database, live API responses, real artefacts |

Four comparisons, in this order. Do not stop early — the last one is where the systemic rot is.

1. **STORY vs CODE** — does the description match the implementation?
2. **CODE vs DATA** — does the implementation produce what it claims? *(the falsification step)*
3. **DATA vs PURPOSE** — does the output actually serve the goal?
4. **CODE vs PURPOSE** — could this design *ever* serve the goal? *(the ceiling test)*

Most reviews stop at 1–2 and call it verified. This one needed 3 and 4.

---

## The ceiling test (comparison 4) — the one that catches systemic design failure

Ask of each mechanism: **what is the maximum this could ever deliver, if it worked perfectly
and every line ran exactly as written?**

Then compare that ceiling to the purpose. If the ceiling is below the purpose, the design is
broken *by construction* — there is no bug to find, no error to log, and no test that fails.

- `latest_post_url` is **one** URL → ceiling is **one edition per author per visit**.
- Purpose: *"capture every single newsletter from an author we cover."*
- One < every. **The design could never have fulfilled its purpose**, and it never once errored.

Ceiling questions that keep finding things:

- A singular noun doing a plural job — `latest_*`, `last_*`, `current_*` holding what should be a set.
- A queue with an ordering and a small `limit` — who is *permanently* last? (the reader sorted
  candidates by "published most recently, top 100 of 939"; an author publishing at an unlucky
  hour ranked 202nd **on its own publication day** and could never be selected.)
- A budget/cap per run — `cap × runs-per-day` vs the actual arrival rate. Is it above or below?
- A dedupe key — what legitimate distinct thing does it collapse?
- A filter — what does it silently exclude, and was that ever the intent?

---

## Method

**Step 0 — write the purpose down first, in their words.** Not paraphrased. If the purpose is not
written down anywhere, that is finding #1 and the review stops until it is agreed.

**Step 1 — decompose the story into atomic, falsifiable claims.** Take the paragraph/doc/comment
and split it into single assertions. "It captures every edition from every author" is one claim.
"It voices them on the desk machine" is another. Vague claims must be sharpened until they are checkable
or marked UNVERIFIABLE.

**Step 2 — for each claim, write the query that would PROVE IT FALSE before running anything.**
If no such query exists, the claim is UNVERIFIABLE — say so, never quietly assume it true. Prefer
a query against an **external** source of truth (the author's own feed, the vendor's API, the
live page) over internal state, because internal state can be uniformly wrong in a way that
looks perfectly self-consistent.

**Step 3 — run it. Record the number.** A verdict without a number is an opinion.

**Step 4 — quantify the blast radius.** One anecdote is a lead, not a finding. Turn it into a
population query: *"how many authors does this affect?"* One author → 60% of the catalogue.
This is the number that tells the owner whether it is a curiosity or an emergency.

**Step 5 — run the ceiling test** on every mechanism in the path, even the ones that passed 1–3.

**Step 6 — report.** Every claim gets a verdict:

- **CONFIRMED** — with the query and the number that could have refuted it.
- **REFUTED** — with the number, and the blast radius.
- **UNVERIFIABLE** — no falsifying query exists. Not a pass. Say what would be needed.

---

## Hard rules

- **A green check is evidence about what the check measures, nothing more.** Read the assertion
  literally. "Has something playable" is not "has everything". Before trusting a guard, ask what
  it would let through.
- **Names are not evidence.** `ingestFresh` tells you what someone hoped. Vocabulary encodes
  assumptions, and a codebase whose every function is named for *freshness* will never notice it
  has no concept of *coverage*.
- **Comments state intent; data states behaviour.** When they disagree, the data wins and the
  comment is a finding.
- **Never verify a system using only the system's own reporting.** The reader's refresh log
  showed `voiced: 0` on every lane for 16 days while the factory was demonstrably voicing ~230/day.
  The counter was broken, not the factory — a system that lies in both directions.
- **"It runs without errors" is not "it does the job."** The 60% loss produced zero errors.
- **Absence of a record is the hardest evidence to see.** Look for what *should* exist and does
  not — missing rows, gaps in a sequence, counts below a known external total. Nothing in a log
  will ever point at a row that was never written.
- **Report to the owner in outcomes, not mechanisms**: "half your members would not have got their
  newsletters next week", not "the candidate ordering was suboptimal".

---

## When to run it

- On any build that has been running **weeks or months** without anyone checking output against
  purpose — the failure mode here is silent and compounding.
- **Before believing any explanation of how a machine works**, including the model's own. If the model
  has just written a confident paragraph describing a system, that paragraph is a STORY layer
  artefact and has not been verified by being written.
- After a symptom the owner reports from a real screen — their anecdotes are the highest-signal leads
  in the whole system, because they come from outside every layer that can be self-consistently wrong.
- Before a launch or a member-facing promise that depends on coverage/completeness.

## Output

A short table (claim → verdict → the number), then REFUTED items expanded with blast radius and
the fix, then the ceiling-test findings, then anything UNVERIFIABLE and what it would take to
settle it. Finish with the one-line answer to: **does this build do what it is for?**
