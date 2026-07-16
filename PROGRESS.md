# PROGRESS.md — DESKA Implementation Tracker

## Completed (34 tasks)
- [x] **Folder structure + meta files** (2026-07-15)
- [x] **Backend: Express + MongoDB** — Server :4000, resilient startup. (2026-07-15)
- [x] **Backend: User model** — 6 roles, 3 permission levels, 2 modes, 4 themes. (2026-07-15)
- [x] **Backend: Auth system** — bcrypt, JWT, MFA TOTP, RBAC hierarchy + dept scope. (2026-07-15)
- [x] **Backend: Organization model** — Plan tiers, feature flags, branding, Stripe, lockdown. (2026-07-15)
- [x] **Backend: AI provider routing** — DeepSeek + Gemini, failover, 15s timeout, STT/TTS. (2026-07-15)
- [x] **Backend: Plan/feature-gating** — PLAN_DEFAULTS (4 tiers, 22 flags), resolve middleware. (2026-07-15)
- [x] **Backend: WebSocket real-time channel** — ws server on /ws, JWT auth, Device model, sendCommand. (2026-07-15)
- [x] **Backend: Stripe integration** — checkout sessions, webhook handling, customer creation. (2026-07-15)
- [x] **Backend: Admin API endpoints** — GET /auth/users, POST /auth/invite, GET /api/org. (2026-07-15)
- [x] **Backend: Audio/speech routes** — POST /api/speech/stt, POST /api/speech/tts, POST /api/reasoning. (2026-07-15)
- [x] **Backend: Device command endpoint** — POST /api/devices/:deviceId/command. (2026-07-15)
- [x] **Backend: PUT /api/org** — Update org name, feature flags, branding, AI providers, lockdown, quota. (2026-07-15)
- [x] **Backend: POST /auth/offboard** — Offboard users, same-org + self + owner-protection guards. (2026-07-15)
- [x] **Backend: POST /auth/mfa/disable** — Password-confirmed MFA reset. (2026-07-15)
- [x] **Backend: Lockdown check middleware** — requireAuth enforces org.lockdownActive, blocks non-GET writes with 403. PUT /api/org exempt. Unauthenticated routes unaffected. (2026-07-15)
- [x] **Frontend: Vite + Tailwind + ReactBits** — AnimatedBackground, GlowCard, FadeIn. (2026-07-15)
- [x] **Frontend: Admin panel shell** — Layout, RequireRole, Dashboard, Users, Organization, Security, Devices, Billing. (2026-07-15)
- [x] **Frontend: MFA setup page** — QR canvas, copy-to-clipboard, idle→verify→enabled. (2026-07-15)
- [x] **Frontend: Stripe checkout flow** — Plan comparison, upgrade→Stripe redirect, success/cancel pages. (2026-07-15)
- [x] **Frontend: Real-time device status** — WebSocket hook, Live indicator, animated transitions. (2026-07-15)
- [x] **Frontend: Remote device commands** — Actions dropdown, confirmation modal, toast notifications. (2026-07-15)
- [x] **Frontend: API integration** — Users, Organization, Billing pages connected to real endpoints. (2026-07-15)
- [x] **Frontend: Real dashboard data** — /auth/me + /api/org + /api/devices + /api/users in parallel. (2026-07-15)
- [x] **Frontend: Profile settings page** — /settings, PUT /auth/profile, theme picker, language selector. (2026-07-15)
- [x] **Frontend: Global API timeout** — 10s default timeout on axios instance. (2026-07-15)
- [x] **Frontend: Registration page** — Email/password/confirm form, POST /auth/register, auto-login redirect. (2026-07-15)
- [x] **Frontend: SetPassword page** — /set-password with email+token URL params, auto-redirect on success. (2026-07-15)
- [x] **Frontend E2E build verification** — 525 modules, 12 pages, 12 routes, 7 nav items, all build cleanly. (2026-07-15)
- [x] **Desktop: Python project** — pystray tray icon, Fernet encrypted SQLite, API client, PyInstaller spec. (2026-07-15)
- [x] **Desktop: Audio pipeline** — WakeListener (energy VAD), STT/TTS modules, VoicePipeline orchestrator. (2026-07-15)
- [x] **Desktop: WebSocket command listener** — WSClient with auto-reconnect, restart/shutdown/update/status handlers. (2026-07-15)
- [x] **Desktop: PyInstaller build** — DESKA.spec with console=False, 46MB binary at dist/DESKA. (2026-07-15)
- [x] **Full project review** — 78/78 E2E tests, 13/13 API cross-references, 12/12 route-nav consistency. Fixed 3 bugs. (2026-07-15)

## Next task
- [x] **Desktop: Remove duplicate .spec** — Deleted incomplete `deska.spec` (32 lines), kept complete `DESKA.spec` (49 lines, console=False). (2026-07-15)
- [x] **E2E: invite + set-password flow** — 7 new tests: invite, set-password, login, /auth/me, reused token (400), double setup (400). E2E: 94/94 passing. (2026-07-15)
- [x] **Frontend: Organization settings page** — Rewritten from read-only to full editable form. Name, AI providers, branding (4 fields), 14 feature flag toggles, lockdown toggle + quota selector (owner-only). Wired to PUT /api/org with toast feedback. (2026-07-15)

## Next task
- [x] **Wire Billing page plan features to backend** — Created GET /api/plans (public, features derived from PLAN_DEFAULTS), Billing.jsx now fetches /plans + /org in parallel instead of hardcoded PLANS array. (2026-07-15)

## Next task
- [ ] **Final project review** — Run all checks, verify PROGRESS.md completeness, report status.
- [ ] **Add E2E tests for invite + set-password flow** — Invite user, verify setupToken, set password, login.
- [ ] **Add E2E tests for MFA setup/verify flow** — Setup → TOTP verify → login with MFA token.
- [ ] **Organization settings frontend** — Wire PUT /api/org to the Organization page form.
- [ ] **Add E2E test for lockdown + company_admin 403** — Company admin tries lockdownActive → 403.
