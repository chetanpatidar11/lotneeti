# LotNeeti execution status

Last updated: 2026-09-26 — E02 complete; E03 started

## Current state
- Active sprint: Sprint 4 (Sprint 1 B09 planner-dependent acceptance pending)
- Overall status: IN PROGRESS
- Current ticket: E03 — 24-hour rolling-limit tracker
- Working branch: `codex/autopilot`

## Completed
- Fresh repository created by human.
- Approved product/planner documents added to repository handoff package.
- Autonomous runbook and sprint plan added.
- A01: Django/DRF project with split development, test, and production settings; PostgreSQL/Redis/Celery configuration; Compose services; versioned health endpoint.
- A02: Next.js TypeScript app builds, calls the versioned API health endpoint, and shows connection state.
- Sprint 0 tooling: one-command check script and CI workflow with PostgreSQL/Redis services, migrations, backend checks, and frontend checks. L10 remains open until planner P0 cases are added to the gate.
- A03: email-based user foundation, workspace and membership models, owner creation service, member-scoped workspace API, and role-based write checks.
- A04: separate Founder Admin flag and platform permission; staff site/overview require platform role independently of workspace ownership.
- A05: single-use email sign-in links, 30-day workspace sessions, sign-in/sign-out web flow, and production SMTP-only configuration.
- A06: Founder Admin password+TOTP staff login, encrypted authenticator seed, replay protection, MFA-gated platform API/staff site, and enrollment command.
- A07: immutable audit event service with actor/object/action/metadata/time and initial workspace/auth/admin hooks.
- B01: workspace-scoped investor create/list/detail/edit/activate API, priority and active fields, masked PAN response, OWNER/OPERATOR write access, VIEWER read-only access.
- B02: PAN encryption at rest, workspace-specific HMAC duplicate lookup, masked API values, edit and duplicate regression coverage.
- B03: CDSL/NSDL demat CRUD, encrypted/masked DP and client identifiers, active state, nested workspace scope and role checks.
- B04: bank CRUD with encrypted/masked account number, owner and cross-funding policy, initial balance history, and workspace isolation.
- B05: UPI CRUD with encrypted/masked handle, bank/holder link, active/verified states, optional limits and workspace isolation.
- B06: investor settings UI with numeric priority editing and move controls, plain lower-number-first explanation, and authenticated workspace/investor proxy routes.
- C01: Add Money action with row locking, immutable balance history and audit event.
- C02: Remove Money action with negative history delta, row locking and audit event.
- C03: Set Balance action with exact replacement amount and recorded old/new difference.
- C04: Funds screen with Add/Remove/Set actions, scoped recent change API and plain-language history.
- C05: recurring payment model with bank, amount, daily/weekly/monthly frequency, start/next/end dates and active state.
- C06: idempotent recurring payment posting with unique due occurrences, bank balance history, Celery Beat schedule and end-date handling.
- C07: scheduled-payment CRUD API and Funds UI for create/edit/pause/delete; deletes archive schedules and preserve posted history.
- C08: ordered, enabled per-beneficiary funding bank preferences with workspace integrity and unique bank selection.
- C09: scoped funding preference CRUD API and investor settings controls to add, rank, pause and remove preferred cross-funding accounts.
- C10: deterministic cross-funding policy resolver for platform, bank, workspace, plan and locked-row context; owner-editable workspace preference; bank prohibition remains binding.
- D01: canonical IPO model for price band, lot, dates, status, issue type, publication state and source identity/provenance.
- D02: founder-only manual IPO provider and API for create/update with preserved source identity, timestamps and audit events.
- D03: ORM-free canonical IPO DTO and provider normalization contract with stable payload hash; manual provider uses the contract.
- D04: append-only GMP observations with IPO, source, signed per-share value, observed/fetched timestamps and provenance metadata.
- D05: founder-only manual GMP observation provider/API with timestamps, append-only history, provenance hash and audit events.
- D06: published IPO API and member-facing GMP value, percent, observed time and history/trend view.
- D07: nullable per-workspace GMP draft-selection threshold with owner-only setting API/UI and audit event; no platform-wide 20% default.
- D08: persisted workspace IPO Apply/Skip decisions, threshold selection rule with manual precedence, member-facing controls and role checks.
- D09: Reset to automatic restores live workspace GMP threshold behavior while retaining a DEFAULT decision state and audit trail.
- D10: per-workspace IPO mode choice for Retail Only, Retail + sHNI, sHNI Preferred and Custom, shown for selected IPOs.
- E01: immutable ORM-free planner input records and canonical serialization with stable IDs, UTC timestamps and normalized decimals.
- E02: exact one-lot Retail and minimum whole-lot sHNI quote calculators above the strict ₹2,00,000 threshold.

## Blockers
- Environment: Git metadata is read-only in this session (`.git/index.lock: Operation not permitted`), so green milestones cannot be committed here. Work continues in the writable worktree.
- Dependency: B09 automatic-planning exclusion cannot be fully verified until E07 planner coverage exists. Investor active state is implemented; B09 remains open until planner tests exercise it.

## Test status
A01: `ruff check backend`, `ruff format --check backend`, `pytest backend` (1 passed), Django system check, and migration drift check passed. Docker is unavailable in this environment, so live PostgreSQL/Redis Compose startup remains unverified here.
A02: frontend lint, typecheck, 2 tests, and production build passed. A live smoke test against a local Django/Gunicorn test-settings server rendered `API connected`.
Sprint 0 gate: `bash scripts/check.sh` passed (backend 1 test, frontend 2 tests, lint, typecheck, migration drift, and production build). CI PostgreSQL/Redis service gate is configured but has not run in this environment.
A03: `bash scripts/check.sh` passed (backend 6 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
A04: `bash scripts/check.sh` passed (backend 9 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
A05: `bash scripts/check.sh` passed (backend 12 tests, frontend 2 tests, lint, typecheck, migration drift, and production build). Local end-to-end smoke verified emailed link, web session, and sign-out with synthetic data.
A06: `bash scripts/check.sh` passed (backend 15 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
A07: `bash scripts/check.sh` passed (backend 17 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
B01: `bash scripts/check.sh` passed (backend 20 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
B02: `bash scripts/check.sh` passed (backend 21 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
B03: `bash scripts/check.sh` passed (backend 23 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
B04: `bash scripts/check.sh` passed (backend 26 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
B05: `bash scripts/check.sh` passed (backend 28 tests, frontend 2 tests, lint, typecheck, migration drift, and production build).
B06: `bash scripts/check.sh` passed (backend 28 tests, frontend 4 tests, lint, typecheck, migration drift, and production build). Local web/API smoke passed for workspace creation, investor creation and priority editing.
C01: `bash scripts/check.sh` passed (backend 30 tests, frontend 4 tests, lint, typecheck, migration drift, and production build).
C02: `bash scripts/check.sh` passed (backend 31 tests, frontend 4 tests, lint, typecheck, migration drift, and production build).
C03: `bash scripts/check.sh` passed (backend 32 tests, frontend 4 tests, lint, typecheck, migration drift, and production build).
C04: `bash scripts/check.sh` passed (backend 33 tests, frontend 5 tests, lint, typecheck, migration drift, and production build). Local web/API smoke passed for bank creation, all balance actions and recent history.
C05: `bash scripts/check.sh` passed (backend 35 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
C06: `bash scripts/check.sh` passed (backend 39 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
C07: `bash scripts/check.sh` passed (backend 41 tests, frontend 5 tests, lint, typecheck, migration drift, and production build). Local web/API smoke passed for scheduled-payment create/edit/pause/delete and Funds display.
C08: `bash scripts/check.sh` passed (backend 43 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
C09: `bash scripts/check.sh` passed (backend 45 tests, frontend 5 tests, lint, typecheck, migration drift, and production build). API tests cover ranking, duplicate/own-bank rejection, workspace isolation and VIEWER write denial.
C10/Sprint 2 gate: `bash scripts/check.sh` passed (backend 54 tests, frontend 5 tests, lint, typecheck, migration drift, and production build). Policy tests cover override order, bank prohibition, warning, own account, locked row and workspace owner access.
D01: `bash scripts/check.sh` passed (backend 62 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D02: `bash scripts/check.sh` passed (backend 65 tests, frontend 5 tests, lint, typecheck, migration drift, and production build). API tests cover founder MFA, non-founder denial, invalid dates and source isolation.
D03: `bash scripts/check.sh` passed (backend 67 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D04: `bash scripts/check.sh` passed (backend 69 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D05: `bash scripts/check.sh` passed (backend 71 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D06: `bash scripts/check.sh` passed (backend 73 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D07: `bash scripts/check.sh` passed (backend 75 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D08: `bash scripts/check.sh` passed (backend 78 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
D09: `bash scripts/check.sh` passed (backend 78 tests, frontend 5 tests, lint, typecheck, migration drift, and production build); regression test covers restored threshold behavior after reset.
D10/Sprint 3 gate: `bash scripts/check.sh` passed (backend 78 tests, frontend 5 tests, lint, typecheck, migration drift, and production build). Fresh SQLite migration from empty DB also passed. IPO modes persist independently of manual/automatic selection.
E01: `bash scripts/check.sh` passed (backend 80 tests, frontend 5 tests, lint, typecheck, migration drift, and production build).
E02: `bash scripts/check.sh` passed (backend 86 tests, frontend 5 tests, lint, typecheck, migration drift, and production build); QC-001 to QC-003 and boundary/invalid inputs covered.

## Decisions
Use approved architecture and specifications. Do not replace product requirements with generic assumptions.

- Use a `backend/` Django modular monolith and a separate `web/` Next.js application.
- Use PostgreSQL and Redis in local development through Docker Compose; use an isolated SQLite settings module for fast deterministic unit tests.
- Keep the health endpoint under `/api/v1/health/` so A02 can verify frontend-to-backend connectivity.
- Monthly recurring payments scheduled on days 29-31 use the last day in shorter months and return to the original day when available.

## Next action
Implement E03 pure 24-hour UPI/bank rolling count and amount tracker, including cancellations and shared bank use.
