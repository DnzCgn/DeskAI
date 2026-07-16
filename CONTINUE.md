# CONTINUE.md — Session Continuity for the DESKA Project

This file explains how `SPEC.md`, `CONTINUE.md`, and `PROGRESS.md` work together across implementation sessions.

## How the three files work

- **SPEC.md** — the full product specification (the DESKA system prompt), never modified during implementation.
- **CONTINUE.md** — this file; describes the workflow and PROGRESS.md format.
- **PROGRESS.md** — the live task tracker updated after every completed task per Appendix B.

## When resuming work

If `PROGRESS.md` already exists at the project root:
1. Read `PROGRESS.md` to find the first task marked `[ ]` (not started).
2. Begin building from that task in natural dependency order.
3. Follow Appendix B exactly for every task.
4. Do not redo tasks already marked `[x]` unless a regression check reveals they are broken.

If `PROGRESS.md` does not exist, this is a fresh start:
1. Create the three root folders: `/frontend`, `/backend`, `/desktop`.
2. Create `PROGRESS.md` using the format below.
3. Begin with environment/config setup, then database layer, auth/roles, AI provider layer (Section 35), then feature-by-feature.

## PROGRESS.md format

```
# PROGRESS.md — DESKA Implementation Tracker

## Completed
- [x] **Task name** — Verified: (what was checked). (YYYY-MM-DD)

## Next task
- [ ] **Task name** — (short description of what to implement)

## Backlog
- [ ] **Task name** — (description)
```

Rules:
- Only one task in the "Next task" section at a time.
- When completing a task, move it to "Completed" with verification notes and date, then promote the next backlog item to "Next task".
- Update immediately after each task's verification passes — never batch multiple tasks without updating.
