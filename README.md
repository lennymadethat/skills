# Skills

**Six Claude Code skills, built in daily use, owner-neutral.**

A skill is a folder with a `SKILL.md` that Claude Code loads when you type
its slash command or describe the job. These six are the ones that changed how
one person ships: a loop that finishes a build without you, a review that
catches systems doing the wrong thing without a single error, a redesign
method that beats months of patching, and three ways to make things look
expensive on purpose.

| Skill | Say | What it does |
|---|---|---|
| **finish-line** | `/finish-line` | Interview → acceptance contract (every check default FAIL) → a resumable loop that builds one slice at a time with a cheap builder, verifies with a fresh-context read-only checker, books the result, and stops when every check is PASS or PARKED. Templates included (progress file, checks.json, hooks, a Workflow script). |
| **logic-review** | `/logic-review <build>` | Forces four layers to agree: the purpose, the story, the code, and the data it actually produced. Finds designs that could never do the job and never errored. The ceiling test. |
| **fresh-eyes** | `/fresh-eyes <screen>` | Rebuild one screen from a blank sheet without reading the old code, then diff the two mechanically (frame rate, easing, type, hierarchy), then port the wins without trampling dated decisions. |
| **particle-forge** | `/particle-forge` | A GPU ember point-cloud system for the web: seven named moves (form, morph, explode, traverse, depth-rotate, react, re-materialize), the GLB→points bake pipeline, budgets, a licence-checked steal shelf, and the taste rules. |
| **scroll-world** | `/scroll-world` | Apple-style scrollytelling pages: pre-rendered frame scrub or a live WebGL camera rail, the photo → AI shoot → video → frames pipeline, boilerplate for both. |
| **infographic** | `/infographic` | One clean white-ground system diagram or "what's in the box" picture, palette-swapped per brand, generated with an image model and verified label by label. |

## Install

Copy any folder into your Claude Code skills directory:

```
git clone https://github.com/lennymadethat/skills.git
cp -r skills/skills/finish-line ~/.claude/skills/
```

Or all six:

```
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
- **particle-forge** and **scroll-world** want a static site repo and a browser
  you can screenshot with (Playwright). Model files stay out of the public repo.
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
