---
name: fresh-eyes
description: Redesign one screen or moment of an existing app by building the IDEAL version from a blank sheet first, then mechanically diffing it against the current implementation, then porting the wins back without trampling locked decisions. Use when the user says "/fresh-eyes <target>", "fresh eyes on X", "why does X look worse than Y", "glow up X", or wants an already-built piece of UI to get the treatment that a rebuild-then-diff makes visible. One screen or moment per run — not a whole app.
---

# Fresh Eyes — rebuild-then-diff redesign of one screen

Born from a 2026-08-20 session where a karaoke screen, patched for months, sat next to
a reader designed in a day from a blank page, and the blank page won 10×. The reason was NOT
talent or luck; it was three mechanical conditions this skill recreates on demand:

1. **The ideal version is designed as if the current one doesn't exist** (editing anchors to
   existing structure; a clean sheet reaches for the best known patterns instead).
2. **The two versions are confronted side by side and the gap is explained MECHANICALLY**
   (frame rates, easing, typography, hierarchy — never "cleaner" or "more modern").
3. **The port back keeps the scar tissue** (the old build is full of hard-won,
   dated decisions; aesthetics move, those stay).

## The one hard law

**Do NOT read the target's implementation code before Phase 1 is finished.** Code is the
strongest anchor there is — one glance and the "ideal" becomes a refactor. Screenshots,
the live page in a browser, and the owner's description are allowed. Source files are not.
(Repo CLAUDE.md / deploy docs are fine — that's logistics, not design.)

## Step 0 — Scope the aperture

The unit of work is **one screen, or one moment of one screen** ("the seconds while words
are being spoken", "the empty library state", "the Up-next handoff"). If the owner names a whole
app or a vague area, ask ONE question to narrow it: "Which moment — the one someone stares
at longest?" Default to the screen users spend the most time looking at.

Then get the **feeling brief** — one sentence describing how the moment should FEEL, not
what widgets it has ("calm, one thought at a time, read to you by candlelight"). If the owner
gave one, use it verbatim. If not, propose one and let them correct it; don't block on it.

Collect reference material:
- A screenshot or the live URL of the CURRENT thing (look at it — don't read its code).
- Optionally a reference the owner loves (Apple Music lyrics, any screenshot). A great outside reference is as good as an owned one.

## Phase 1 — Clean sheet

Build the ideal version of the moment as a REAL, runnable, self-contained prototype —
a single standalone HTML file in the scratchpad (inline CSS/JS, no framework, dark theme
if the target is dark). It must actually run: real motion,
real easing, real typography, sample content that resembles the real content. A static
mock hides exactly the things (timing, easing, flow) that make the difference.

Rules for this phase:
- Design from the feeling brief + the product's brand (colors/logo may come from the
  current screenshot — brand is identity, not implementation).
- Reach for the best patterns known for this kind of moment, regardless of what the
  current implementation does. Load the `frontend-design` skill for aesthetic direction
  if the moment is visually central; load `dataviz` if it's a chart.
- Spend real effort here. This is the phase where the 10× lives.

Send the prototype file to the owner so they can feel it on their phone.

## Phase 2 — The confrontation

NOW read the current implementation. Put the two side by side and write the gap analysis
as a numbered list where every item is **mechanical and portable**:

- Update cadence / frame rate of anything that moves (poll intervals, event rates, rAF).
- Easing: what snaps vs what eases, with curve + duration.
- Typography: face, size, weight, line-height — "UI text" vs "reading text".
- Hierarchy and staging: what is illuminated, what recedes, how many things compete.
- Canvas: what else is on screen fighting the moment; what could yield (lean-back etc.).
- Structural handicaps (WebView islands, bridge latency, repaint-per-keystroke, etc.).

Banned words in this phase: cleaner, fresher, more modern, more polished, elevated.
If an item can't be stated as a measurable difference, it doesn't go on the list.

## Phase 3 — The port

Port the wins into the real app. Non-negotiables:

- **Scar tissue stays.** Before touching anything, grep the target for dated decision
  comments ("2026-", "#ui", "was X — broke Y"). Those are LOCKED: layout sizes,
  removed buttons, window heights, ordering decisions. Aesthetics (motion, type,
  hierarchy, staging) move; recorded decisions don't. When a win conflicts with a locked
  decision, the decision wins — note the conflict for the owner instead of overriding it.
- **All surfaces, one pass** (standing rule): web + Android + iOS + desktop where they
  share the UI. Native mirrors adapt the mechanism (e.g. velocity-interpolated WebView
  JS when a native can't post positions at 60fps — see PlayerScreen.kt's interpTick).
- **Dev first** per the repo's deploy rules; link the dev page. Prod only on the owner's go.
- Verify like it matters: local compile for Android, esbuild/node --check for web,
  watch CI for YOUR sha for iOS.

## Step 4 — Close

Report as: what the ideal taught us (the mechanical list), what got ported, what was
deliberately NOT ported and why (locked decisions, platform limits), links/paths to
review. Append a short entry to the product's project notes. If a genuinely
reusable lesson surfaced (like "the CDN's default image crop"), save it to your memory.

Keep the Phase 1 prototype file — attach it in the close-out so the ideal survives as a
reference even where the port stopped short of it.
