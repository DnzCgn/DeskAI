You are now QA-testing the DESKA project end to end. Read SPEC.md completely first (all sections), then follow this process exactly. This is a separate activity from normal building (CONTINUE.md/PROGRESS.md track build tasks; this file governs testing and bug-fixing only, logged in a separate file, REPORT.md).

Do not skip ahead to fixing anything before you finish a full Discovery Pass. Do not stop after fixing the first batch of bugs. Repeat the full loop below until an entire Discovery Pass finds zero new issues.

---

## 1. The loop (repeat as one "round" until a Discovery Pass finds nothing)

**Phase 1 — Discovery Pass (find and note only, do not fix yet).**
Go through every item in the checklist in Section 4 below, in order. For each one, actually exercise it (call the endpoint, run the flow, launch the app, click through the panel — whatever is appropriate) using the methodology in Section 2. For every item that fails, behaves incorrectly, is missing entirely, or contradicts a rule in SPEC.md, add one entry to REPORT.md's "Open Issues" list (format in Section 3) with a stable ID. Do not fix anything during this phase, even if the fix looks trivial — finish the entire checklist first, so later fixes aren't made against an incomplete picture of what's broken.

**Phase 2 — Fix Pass.**
Go through REPORT.md's Open Issues one at a time. For each: fix it, then verify the specific fix works by re-running the exact check that originally found it, then run a quick regression check on anything plausibly connected (per SPEC.md Appendix B), then move the entry from "Open Issues" to "Fixed Issues" in REPORT.md with a one-line note on what changed and what was verified. Never batch multiple fixes before verifying — one issue at a time, verify, log, next.

**Phase 3 — Full Re-Test Pass.**
Once every issue from this round's Discovery Pass is in "Fixed Issues," re-run the ENTIRE checklist in Section 4 again from the top — not just the items that failed before. Fixes can break things that previously worked; this is why the whole list gets re-tested, not a partial one. Log any new findings the same way as Phase 1 (they belong to the next round).

**Repeat rounds 1→2→3 until a Discovery Pass produces zero new Open Issues.** When that happens, state clearly in REPORT.md that testing is complete, with the round number and date.

---

## 2. Testing methodology — how to exercise each checklist item

Most items must be tested more than one way. Use whichever of these apply to that item:

1. **Single-account test** — as one user, in one organization (or in Personal Mode with no organization at all).
2. **Cross-role test** — repeat the relevant check while logged in as each different role in the SAME organization (Owner, Company Admin, Department Manager, Team Lead, Employee, Auditor — SPEC Section 11) to confirm permission boundaries actually hold, not just for one role.
3. **Cross-organization test** — create at least two separate test organizations ("Test Org A," "Test Org B") with their own accounts, and confirm nothing (data, learned actions, analytics, marketplace function data, knowledge base content) ever crosses between them (SPEC Section 23.4). This specifically needs multiple accounts in multiple organizations, not just multiple roles in one org — do not skip this and assume cross-role testing already covers it.
4. **Multi-employee-in-one-org test** — for shared/concurrent features (e.g. a shared backend function, Section 26), use at least two employee accounts in the same organization acting at the same time.
5. **Personal Mode test** — run the relevant subset of checklist items with no organization at all, where applicable.

For every item, note in REPORT.md which of these test types were actually used, not just "tested."

---

## 3. REPORT.md format

Create/maintain REPORT.md at the project root with this structure:

```
# DESKA Test Report

## Round: <number>
## Status: <in-progress / complete>

## Open Issues
- [BUG-001] <feature/SPEC section> — <what's wrong> — severity: <low/medium/high/critical> — test type used: <single/cross-role/cross-org/multi-employee/personal>

## Fixed Issues
- [BUG-000] <feature/SPEC section> — <what was wrong> — fix: <what changed> — verified: <what check passed, both the specific fix and the regression check>

## Round Summary
- Round <N>: <X> issues found, <X> fixed, re-test pass <clean / found Y new issues>
```

Keep one running file across all rounds — don't start a new file per round, just add to it, so the full history of bugs found/fixed is visible.

---

## 4. Feature & sub-feature checklist (test every line)

### A. Core voice loop (SPEC Section 2, 3, 4)
- Wake word triggers listening; app is idle/not calling the AI while sleeping.
- STT transcription reaches the reasoning provider correctly (Section 35).
- TTS reply plays back correctly.
- Language auto-detection (EN/TR) works per turn, including mid-conversation switches (Section 1).
- Transcript widget shows only the last 3 exchanges, oldest fades out correctly.
- All 4 color themes render correctly (light green/black, light green/white, light orange/black, light orange/white).
- Assistant name, voice, wake phrase, language preference, keyboard-shortcut wake are all individually changeable and persist (Section 4).
- Offline fallback: simulate no connection to the reasoning provider; confirm local fallback behavior and no duplicate actions once reconnected (Section 2.1).
- Focus mode: simulate a detected screen-share/do-not-disturb state; confirm responses go text-only unless directly voice-triggered (Section 2.2).
- Multi-profile machine: two profiles on one device never mix history/permissions/language (Section 2.3).

### B. Learning mode & execution (SPEC Section 5, 6, 7, 8, 9, 10)
- Recording mode starts/stops correctly and captures an ordered step list.
- Synthesis produces a correct generalized action with fixed vs. variable parts and a sensitivity label.
- Confirmation-preference memory: first-run prompts for a standing preference, remembers it afterward (low/medium only; high always asks).
- Execution respects sensitivity + preference rules exactly (Section 6).
- High-sensitivity actions require the PIN/passphrase step in addition to spoken confirmation (Section 21.4); confirm repeated PIN failures trigger lockout + security_flag, not endless retries.
- Undo works for a recently executed action; a genuinely non-undoable action (e.g. a sent email) says so plainly instead of pretending.
- Permission levels (Observe only / Suggest & confirm / Trusted automation) each behave correctly, and differ correctly per profile on a shared machine.
- Hidden virtual desktop: a disruptive task runs on a hidden desktop while the user's visible desktop is untouched, closes afterward, and the user is notified either way (success or failure).
- Local encrypted storage: confirm data is actually encrypted at rest (not just password-hashed) and is unreadable without the key (Section 10).
- Org-level action sharing (marketplace, Section 5.9): an admin-approved shared action appears for other employees in the department without their own recording, and no one employee's specific recorded example leaks to another.

### C. Enterprise roles, policy, remote control (SPEC Section 11, 12, 13)
- Each of the 6 roles can do exactly what SPEC Section 11 says and nothing more (test cross-role).
- Invitations create a user with the correct role.
- Policy template resolution order (org default → department template → individual override) works correctly, narrowest wins.
- Tone/persona preset from a policy template affects spoken_response style without changing any other rule.
- Remote commands: graduated approach (ask first, escalate only if marked urgent) works; transparency indicator always shows before/while a remote action executes, with no way to suppress it even if requested.
- Anomaly/security flag fires for out-of-pattern remote commands (Section 12.1) without blocking the command itself.
- Decision checklist (Section 13) is effectively being followed — spot-check a few interactions against each of its 8 points.

### D. Analytics & compliance (SPEC Section 14)
- Analytics language always reads as an observation, never a verdict (spot-check wording).
- Proficiency/deficiency/workload/training-plan outputs are all present and correctly role-gated (Manager+ only, never broadcast between employees).
- Employee appeal mechanism routes to the right manager and doesn't auto-resolve.
- Compliance export/delete is role-gated (Owner/Company Admin/Auditor only) and requires explicit confirmation, never inferred from a casual remark.

### E. Plans, tokens, Stripe (SPEC Section 17, 30, 34)
- Every feature flag in the Section 30 table actually turns the matching feature on/off per plan tier — go through the table row by row.
- Quota status transitions correctly: healthy → low → exhausted, with the correct behavior at each stage (Section 17 step 5), including that `exhausted` blocks provider calls and returns `quota_exceeded` without hitting the AI.
- Plan-gated features correctly return `plan_upgrade_needed` when off, without performing the action.
- Stripe Checkout (subscription) and one-time top-up purchases both work; Stripe webhook correctly updates plan/credit balance; a simulated disputed charge is handled without crashing anything.
- BYO API key (Section 17.3): once configured, quota status is always `healthy` and overage rules stop applying.
- AI reasoning/speech provider selection per plan tier matches the Section 30 table exactly (Free/Pro = DeepSeek only; Team/Enterprise = DeepSeek + Gemini opt-in); failover from one provider to the other is invisible to the end user (Section 35.4).

### F. Branding, language, panel (SPEC Section 18, 19, 1.7)
- Branding resolution order (user → org → platform `.env`) works correctly for name, logo, voice, wake sound.
- Org-scoped custom panel language JSON: uploads correctly, is private to that org, and can be reset to platform default from a kept backup (Section 1.7) — confirm this never affects the AI's own spoken-language list.
- Panel visuals use ReactBits components and short, card-friendly response phrasing where relevant (Section 19).

### G. Desktop packaging (SPEC Section 20)
- Packaged app never shows a console/terminal window under any circumstance, including errors, remote commands, and auto-start with Windows.
- A learned/remote action that would normally open a visible console runs hidden instead, with results surfaced only through spoken/widget channels.

### H. Security hardening (SPEC Section 21)
- MFA is enforced for Owner/Company Admin logins; a command lacking proper authentication context is refused, not assumed legitimate.
- Device/session list and revocation work; offboarding an employee immediately kills their sessions and revokes org-scoped secrets/marketplace access.
- Panic/kill-switch blocks every action type (remote commands, learned actions, marketplace calls) org-wide or department-wide while active, and nothing works until it's lifted by an authorized role.
- PIN lockout behavior (see item B above) is covered here too — don't test it twice independently in a way that misses the lockout count/cooldown itself.

### I. UX enhancements (SPEC Section 22)
- Scheduled actions: run correctly at trigger time; a medium/high-sensitivity scheduled action with nobody present is skipped and queued for notification, not run silently.
- Typed input is treated identically to voice for every rule, only the STT/TTS step differs.
- "That was wrong" feedback flagging creates a log entry referencing the right prior action, without arguing with the user.
- Log search answers only from data actually provided, and says plainly when it doesn't have what's asked.
- Multi-device profile sync: settings/personalization/learned actions sync correctly across two of the same user's devices without mixing in anyone else's data.

### J. Integrations & reporting (SPEC Section 23)
- Webhook/integration events actually fire on the right triggers (security flag, completed high-value action, analytics ready).
- Analytics export produces a real file in the requested format, role-gated correctly.
- Multi-tenant isolation (23.4) — this is the most important cross-org test in the whole checklist; verify explicitly with two separate test organizations across every feature that stores data (logs, analytics, learned actions, marketplace functions, knowledge base).

### K. Marketplace & backend functions (SPEC Section 24, 26, 27, 31)
- Function publish → org-level approval → employee install flow is fully role-gated at each step.
- First-run-always-confirms rule for marketplace functions (even `low` sensitivity) works exactly once, then follows normal sensitivity rules after.
- Backend multi-user function data (e.g. a CRM-lite test function): shared correctly within one org across multiple employees, and completely invisible to a second organization.
- Custom Node.js/HTTP hooks run only in the sandbox — confirm they cannot access the filesystem, other orgs' data, or run past their timeout.
- Function versioning/rollback actually restores previous behavior.
- Per-function cost/usage reporting shows real, correct numbers.
- Outbound HTTP rate limiting/circuit breaker actually engages when a destination is hammered or failing.
- Certified/verified badge status displays accurately and doesn't change execution behavior.
- Backend function data backup/export works and can be restored/verified.

### L. Knowledge base, trusted links, AI HTTP (SPEC Section 28, 29, 31.4)
- Answers from org/personal knowledge base are correctly scoped, cite their source naturally, and say plainly when something isn't covered.
- AI-initiated HTTP requests are rejected for any domain not on the trusted allow-list, and succeed once added.
- Attempting to add a private/internal IP or the platform's own infrastructure to the trusted list is rejected outright.
- Personal connectors (calendar/email, 31.5) respect the user's permission level and always confirm before sending anything on their behalf.

### M. HR module (SPEC Section 32)
- Leave requests route to the correct approver and never self-approve.
- Attendance markers (explicit check-in/out and passive activity-based approximation) both work and agree with each other reasonably.
- Employee directory answers only from provided data.
- Announcements deliver exactly once per employee, not repeatedly.

### N. Granular activity logging (SPEC Section 25)
- App-focus data is stored as continuous ranges, not one row per minute — inspect the raw stored data to confirm this directly, don't just trust the UI.
- Retention/compression job correctly turns old ranges into daily summaries without deleting the underlying shape of the data.
- Employees can see their own detailed record; it's never hidden from the person it describes.

### O. Meta: the process files themselves
- PROGRESS.md accurately reflects real project state (spot-check a few "Completed" entries against actual working code).
- CONTINUE.md's resume protocol actually works: simulate a fresh session reading PROGRESS.md and confirm it can correctly summarize state and resume without redoing finished work.
- REPORT.md (this file's own output) stays a single running log across rounds, not fragmented into multiple files.

---

Begin now with Round 1, Phase 1 (Discovery Pass), starting from item A and working through to O. Do not fix anything until the entire checklist has been gone through once.
