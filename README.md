# Skills

**Six Claude Code skills, built in daily use, owner-neutral.**

![Six skills for Claude Code: /finish-line builds until every check passes, /logic-review catches quiet wrong answers, /fresh-eyes redesigns a screen from a blank sheet, /wrap-it-up hands off a session with nothing lost, /how-it-works writes the technical white paper, /infographic makes one clean, checked diagram](docs/six-skills.png)

A skill is a folder with a `SKILL.md` that Claude Code loads when you type
its slash command or describe the job. These six are the core workflows that changed how
one person ships: a loop that finishes a build without you, a review that
catches systems doing the wrong thing without throwing errors, a clean-sheet redesign
method that beats months of patching, a session handoff that never loses context, a white-paper generator, and clean visual architecture blueprints.

| Skill | Say | What it does |
|---|---|---|
| **finish-line** | `/finish-line` | Interview → acceptance contract (every check default FAIL) → a resumable loop that builds one slice at a time with a cheap builder, verifies with a fresh-context read-only checker, books the result, and stops when every check is PASS or PARKED. Templates included (progress file, checks.json, hooks, a Workflow script). |
| **logic-review** | `/logic-review <build>` | Forces four layers to agree: the purpose, the story, the code, and the data it actually produced. Finds designs that could never do the job and never errored. The ceiling test. |
| **fresh-eyes** | `/fresh-eyes <screen>` | Rebuild one screen from a blank sheet without reading the old code, then diff the two mechanically (frame rate, easing, type, hierarchy), then port the wins without trampling dated decisions. |
| **wrap-it-up** | `/wrap-it-up` | Session closeout and handoff: records current state, logs architectural decisions and gotchas, and outputs a paste-ready continuation prompt so the next session resumes seamlessly. |
| **how-it-works** | `/how-it-works <system>` | Architectural white-paper generator: builds deeply technical explainers, system flow diagrams, and transparent trade-off disclosures in your product's native branding. |
| **infographic** | `/infographic` | One clean white-ground system diagram or "what's in the box" picture, palette-swapped per brand, generated with an image model and verified label by label. |

## Install

Copy any folder into your Claude Code skills directory:

```bash
git clone https://github.com/lennymadethat/skills.git
cp -r skills/skills/finish-line ~/.claude/skills/
```

Or all six:

```bash
cp -r skills/skills/* ~/.claude/skills/
```

Open a new Claude Code session; the skills appear in its list. [`KIT.md`](KIT.md)
is a paste-prompt that installs them and walks you through the first run of
each.

## What each expects from you

- **finish-line** wants a repo with a `dev` branch that auto-deploys somewhere
  you can look at, and a coding agent that can run subagents (it uses Claude
  Code's Workflow tool). Optional: a Telegram bot token in a git-ignored
  `.loop-secrets.json` for one line per closed check on your phone.
- **logic-review** wants access to the real data (a database, live routes, an
  external source of truth). It is useless against code alone, on purpose.
- **fresh-eyes** wants one screen, a screenshot or a live URL, and a one-line
  feeling brief. It will refuse to read the old code until the ideal exists.
- **wrap-it-up** works in any active project repo to capture state, gotchas, and next-session prompts.
- **how-it-works** wants access to entry files and CSS design tokens to write an honest, in-depth architectural breakdown.
- **infographic** wants a `GEMINI_API_KEY` in the environment for the
  generator script, and a row in `brands.md` measured from your product's CSS.

## Conventions these skills share

- Every rule that must survive a fresh context is a hook or a script, not prose.
- A green check is evidence about what the check measures, nothing more.
- Dev first, prod on the owner's word.
- Secrets are pointers, never values, in any file an agent writes.
- Never orange in an infographic. (You will thank us.)

## License

MIT. Use them, fork them, make them yours.

<sub>Made by [lennymadethat](https://lennymadethat.com).</sub>
