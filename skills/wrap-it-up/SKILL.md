---
name: wrap-it-up
description: End-of-session handoff — record current state, document decisions, and generate a paste-ready continuation prompt so the next AI agent session resumes with zero lost context. Use when the user says "wrap it up", "wrap this up", "we're done for now", "hand off", "save this session", or signals a stopping point.
---

# Wrap It Up — Session Closeout & Continuity Handoff

Clean handoff for AI coding sessions. Ensures that context, resolved decisions, and active blockers survive into the next session without requiring the human to manually reconstruct what happened.

## The Core Rule

**Never rewrite past history in full.** Every session log is an append or a new file. If you overwrite a previous session log, you destroy debugging history.

---

## The 4 Steps

### 1. Document Current State
Determine:
- **What shipped / what works:** Explicit files modified, endpoints created, tests passing.
- **What is blocked / unfinished:** Half-written functions, failing tests, unmerged branches.
- **Key decisions made:** Why an approach was chosen and what alternatives were rejected.
- **Gotchas / traps:** Unobvious environment quirks, API rate limits, edge cases discovered.

### 2. Append to Session Log
Write or append to a local project file (e.g. `docs/session-log.md` or `.sessions/YYYY-MM-DD-{topic}.md`):
- **Date stamp**
- **Summary:** One paragraph explaining the session's objective.
- **Status table:** Components completed vs. in-progress.
- **Decisions & Gotchas:** Bulleted with precise file names and line pointers.

### 3. Git Check
- Check `git status` and verify all working changes are committed or stashed cleanly.
- If there are uncommitted changes, advise the user or commit them with an informative message.

### 4. Output the Continuation Prompt
Output a single fenced code block containing a **paste-ready continuation prompt** that the developer can paste into a fresh Claude or agent session tomorrow:

```markdown
Continue from our previous session on [Project Name].
Read `docs/session-log.md` (or recent commit log) first.

Current status:
- Done: [1-3 items completed]
- In progress: [Item currently mid-build]

Immediate priorities for this session:
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

Guardrails / Do NOT touch:
- [Area that is working and should not be refactored]

Pick up where we left off.
```

Done means done.
