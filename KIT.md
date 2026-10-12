# KIT.md — paste this into your agent

Copy everything below the line into Claude Code. It installs the six skills
into your skills folder and runs a first, small exercise of each so you know
what they feel like. Budget: about 15 minutes. No spend except the infographic
step, which you can skip.

---

You are installing the six skills from https://github.com/lennymadethat/skills
into this machine's Claude Code. Work through every step and stop only when you
need a value from me.

**1. Install**

```bash
git clone https://github.com/lennymadethat/skills.git /tmp/lmt-skills
cp -r /tmp/lmt-skills/skills/* ~/.claude/skills/
ls ~/.claude/skills
```

Confirm all six folders are there: `finish-line`, `logic-review`,
`fresh-eyes`, `wrap-it-up`, `how-it-works`, `infographic`. Tell me to open
a new session so they load, then continue from step 2 in that session.

**2. logic-review, on something real**

Ask me for one system I run that has been going for weeks without anyone
checking its output against its purpose. Run `/logic-review` on it. Report the
claim → verdict → number table. Do not stop at "the code looks right".

**3. fresh-eyes, on one screen**

Ask me for one screen and one sentence about how it should feel. Run
`/fresh-eyes`. Do not read the screen's code until the prototype exists.

**4. finish-line, dry**

Do not run the loop yet. Read `~/.claude/skills/finish-line/SKILL.md` and its
`templates/`. Tell me, in five lines, what a repo needs before the loop can run
(a dev branch that deploys, the hooks, the secrets file, the checker type), and
which of my repos is closest to ready.

**5. wrap-it-up, on current state**

Run `/wrap-it-up` to document what we just tested, generate the session log, and output a clean continuation prompt.

**6. how-it-works (optional dry-run)**

Pick one project in this workspace and tell me the 3-4 core concepts and diagram structure it would decompose for a technical white paper.

**7. infographic (optional; spends a few cents)**

If I want it: set `GEMINI_API_KEY` in the environment, add a row for my brand
to `~/.claude/skills/infographic/brands.md` measured from my CSS, and run
`/infographic` for one of my products in the system-diagram shape. Verify every
label by reading the PNG back.

**8. Report**

List what was installed, what each exercise found, and the one skill I should
use next week and why.
