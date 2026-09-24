---
name: infographic
description: Make one infographic in a clean house style (pure white ground, one brand accent, white cards with thin grey borders, numbered orange/blue circles, flat illustrated characters, generous spacing, few exact labels), palette-swapped to whichever brand it is for. Use when the user says "/infographic", "make an infographic of X", "white background infographic", "what comes in the box", "show the pieces of X", or asks for the beautifully laid out white infographics with the characters. One image per run; re-roll only the one that fails verification.
---

# /infographic — one picture, house style

One clean white-ground diagram style, palette-swapped per brand. This skill is the one place it lives.

## Steps

1. **Pick the brand** from `brands.md` (add a row for yours, measured from your CSS). Never mix two.
2. **Write the content list first, in plain words**, before any prompt: title, subtitle, the
   character's one line, the cards (label + one caption each, max 6), an optional numbered flow
   (max 4 steps), an optional "not included" card. Every card must name something REAL —
   check the repo or your notes, never invent a file or a feature.
3. **Assemble the prompt** from `template.md`: STYLE block with the brand's hexes filled in,
   then LAYOUT with the exact text. Say "only these exact labels". Fewer, larger words win.
4. **Generate** with `nb.sh` in this folder (curl, not urllib — urllib 403s):
   `MODEL=gemini-3-pro-image-preview ASPECT=16:9 bash nb.sh out.png "$(cat prompt.txt)"`
   Pro renders text; Flash (`gemini-3.1-flash-image`) is for drafts only. Key = `GEMINI_API_KEY`
   in `your secrets file`. the owner asking for the picture IS the spend permission;
   do not batch ten variants unasked.
5. **Verify by reading the PNG.** Every label spelled right, no invented text, no logos, the
   character has the right number of arms. A wrong label = re-roll that one image, same prompt.
6. **Save** the PNG and its prompt side by side: `<pictures>/<project>/<slug>-v<n>.png` +
   `.prompt.txt`. If it is for a product page, copy into that product's static dir and
   self-host — never hot-link the generator. Send it to the owner.


## Two shapes, pick by subject
- **A system / engine / product → SYSTEM DIAGRAM.** The thing itself is the hero, drawn as a
  machine or appliance in the centre; inputs on the left, stores on the right, the value strip
  at the bottom. What is in the pack is ONE small grey footer line. Never a cardboard box for an
  engine ("way to undersell"). README and LICENSE never get a card. `example-system-diagram.prompt.txt`.
- **A literal bundle of files (a kit, a starter folder) → THE BOX.** Cards spilling out of an
  open box, real filenames only. `example-harvester-pack.prompt.txt`.
- Connector lines THIN with small arrowheads. A fat arrow reads as a flowchart, not a diagram.

## Rules (hard-won)
- White ground, always. One accent, and never orange. Blue/white, light blue/white, or red/white/blue. Status colours only for status.
- Say the real term. "Vectorizes" not "chops and fingerprints". Index = a rolodex or card index, never a cylinder of chunks.
- Show the thing HAPPENING. Memories visibly created at the agents, carried, filed. Arrows from a phone into a book read as nothing.
- The store is the biggest object; a rulebook is a small prop on the desk, never the hero.
- Real titles under the friendly ones: "THE LIBRARIAN / MCP memory server", "THE LIBRARY / Hosted database". Name MCP.
- ONE tidy line before the transforming step; fan-out only after it. Crossing arrows read as two journeys.
- No presenter character unless asked. The maker-in-a-bubble is off by default.
- Generative video mutates these after ~3 s. To animate,
  rebuild the panels as layered HTML/CSS and screen-record. Never Veo on a full infographic.
- No brand marks or logos inside the art; the page supplies the logo.
- 16:9 for pages and ads, 1:1 for cards, 3:4 for phone. Say it in ASPECT, not in the prompt.
- Phone: 1376 px art renders at ~350 px wide — plan for pan-to-read or fewer cards.
- Characters: friendly semi-realistic flat portraits inside circles, speech bubble, short quote.
  A harvester is a farmer figure; a shop-floor product uses a hi-vis worker, technician, manager.

## Files
- `template.md` — STYLE + LAYOUT skeleton with `{{slots}}`.
- `brands.md` — per-brand accent / ink / fill hexes, measured from each repo's CSS.
- `nb.sh` — the generator helper. `MODEL` and `ASPECT` env vars.
- `example-harvester-pack.prompt.txt` — the BOX shape.
- `example-system-diagram.prompt.txt` — the SYSTEM shape (Second Brain, blue), the default for engines.
