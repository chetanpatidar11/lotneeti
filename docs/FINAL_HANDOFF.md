# LotNeeti founder beta handoff — draft, not release approval

Updated 2026-09-27. The local code gate is green, but required external and founder acceptance gates below remain open. Do not invite beta users or call the project complete yet. The detailed ticket record is in [`exec-plans/STATUS.md`](exec-plans/STATUS.md).

## Implemented local scope

- Workspace authentication, roles, Founder Admin MFA, masking/encryption and audit events.
- Investor, demat, bank, UPI, Balance and Scheduled Payments/EMI flows.
- Manual IPO/GMP providers, IPO selection and a deterministic Planner v2 preview/editor with locks, validation and generic CSV export to private S3.
- Application submission/block/allotment tracking, sale recording, realized profit and workspace reports.
- EC2, Nginx, systemd, private S3 policy, encrypted backup and isolated restore assets.
- Capacitor Android beta **launcher** that opens the hosted HTTPS site in the official Browser plugin. The full web UI is not bundled in the APK.

## Exact automated evidence

On 2026-09-27, `bash scripts/check.sh` passed: 263 backend tests, 20 frontend tests, one Android packaging test, all 115 Planner v2 P0 and 5 P1 matrix IDs mapped to executable assertions, Ruff check and format, Django system check and migration drift check, Next.js lint/typecheck/production build, and Capacitor typecheck/build/native sync. A fresh test-settings database migration succeeded. The synthetic API scenario exercised IPO APPLY, plan preview/edit/lock, exact CSV export, submission/block, partial allotment, sale and realized profit. Four frozen synthetic plan snapshots passed. L04 rate-limit tests cover 429 responses and trusted proxy/user isolation. M06 stores privacy-safe workspace milestones without payloads. F02 tests cover applicant changes and duplicate/eligibility blocking. F09 reason summaries and E14 owner-affinity swaps are covered by focused tests. K07 redacted support lookup passed access and privacy tests. D13/K03 preserve separate IPO source and override history with validated resume-auto behavior and effective values integrated into public/planner projections. D14 adds redacted GMP provider health and audited, expiring provider controls. K04 adds audited, expiring per-observation GMP corrections with source/effective/freshness display and public/planner integration. K05 adds local AI content versioning and reasoned publication history without paid AI dependencies. K06 adds audited effective-dated planner policy resolution. H07 and I03 remain covered by the application timeline and realized P&L aggregation/period tests.

The CI workflow is configured for PostgreSQL and Redis services, but no remote CI run from this worktree is evidenced. No real AWS, PostgreSQL/S3 restore drill or Android APK/device run has occurred in this workspace. Git metadata is read-only here, so the green worktree changes are uncommitted. The last existing commit, `1b4baca`, predates this work and is **not** a green milestone for these changes.

## Local setup and demo

Prerequisites: Python 3.12+, Node.js 22+, Docker Compose. Follow the [root README](../README.md): copy `.env.example` to a local `.env`, set a random local Django secret and an explicit `PLANNER_PLATFORM_CROSS_FUNDING_POLICY` (`ALLOW`, `WARN` or `DISALLOW`), create `.venv`, install `backend[dev]`, start PostgreSQL/Redis with Compose, migrate, then run Django and the Next.js dev server. Install both frontend and mobile dependencies with `npm ci --prefix web` and `npm ci --prefix mobile` before running `bash scripts/check.sh`. Configure a private S3 export bucket for an actual export; the automated flow uses an isolated fake S3 client.

No real account or password is supplied. Local email sign-in links appear in the Django console backend. A founder staff account can be created with `createsuperuser` and enrolled with `enroll_founder_totp <email>`; keep the generated authenticator secret outside the repository. `backend/tests/scenario_17_pan.py` is a deterministic synthetic planner fixture, not a database seed command. There is no one-command interactive demo seed yet. Use obviously synthetic identities and account identifiers when entering data manually.

Suggested manual demo: sign in; create a workspace and synthetic investor/demat/bank/UPI; Add Money; create a Scheduled Payment; publish a manual IPO and GMP observation through Founder Admin; set workspace selection to APPLY; preview a plan, edit/lock a row, validate and export; start tracking, mark Submitted and Blocked, record partial allotment, then record a sale and inspect realized profit. A second workspace should not see any of the first workspace's records.

## Deployment and Android

Follow [`deploy/EC2_BETA.md`](../deploy/EC2_BETA.md) for a reviewed revision on one low-cost EC2 host. Keep secrets in root-controlled environment files, use HTTPS, configure private export/backup buckets and an instance role, then run `deploy/deploy.sh`. Configure budget alerts before leaving chargeable resources running. Follow [`deploy/BACKUPS.md`](../deploy/BACKUPS.md) and record a successful **real** encrypted backup plus isolated restore before beta invitations. None of these steps has been performed on AWS here.

Follow [`mobile/README.md`](../mobile/README.md) to build and sync the Capacitor Android project with the actual HTTPS beta origin. Android Studio/SDK and device testing are still required. The application ID is temporary, the generated icon is a placeholder, and signing credentials must stay outside Git. The current APK would be a hosted-site launcher; a complete Capacitor packaged UI requires a client-side frontend build or another approved mobile architecture.

## Known limits and external blockers

- B07/B08/G03: approved account import and broker workbook formats/mappings are missing. Generic CSV export is available; sample-compatible workbook import/export is open.
- K02: stale-provider age and conflicting-source definitions are missing.
- M03: founder-approved sanitized 15–25 historical expected plans are missing. Synthetic regression cases do not replace that approval.
- Platform cross-funding policy must be explicitly chosen before planner preview.
- L06/L07/L08/L11/L12 require a live paid-cloud setup and verification; no paid service or API credits were used. Private S3 export also needs live verification.
- Android full wrapper, actual signed APK and device acceptance are open. The launcher needs a reachable HTTPS deployment.
- K02 remains open because approved stale/conflict rules are missing; see STATUS.md. The J08 accessibility baseline has code-level coverage, but screen-reader and physical-device acceptance remain manual. No public licensed IPO/GMP provider, paid AI integration, or production mobile OTP is connected.

## Manual acceptance checklist

- [ ] Confirm the chosen platform cross-funding policy and beta domain.
- [ ] Sign in/out through the email link; verify Founder Admin password plus TOTP and role denial for non-founders.
- [ ] Create two workspaces and verify member, VIEWER and cross-workspace access boundaries.
- [ ] Create/edit synthetic investor, demat, bank and UPI; inspect masking; change applicant priority.
- [ ] Exercise Add Money, Remove Money, Set Balance and Scheduled Payments; verify Balance/Blocked/Planned/Available math.
- [ ] Enter/publish a manual IPO and GMP value; test threshold, APPLY/SKIP/reset precedence and IPO modes.
- [ ] Compare founder-approved historical plans when available; verify deterministic output, owner reserve, rolling limits, sHNI and locks.
- [ ] Edit plan category/lots/demat/bank/UPI, re-plan unlocked rows, inspect warnings, and verify blocking plans cannot export.
- [ ] Import an approved sanitized workbook and export broker workbook after mappings are supplied; check exact identifiers and totals.
- [ ] Track Submitted and Blocked applications; record not allotted, full and partial allotment; check next-day cash reuse.
- [ ] Record split sales and charges; verify per-IPO/investor/workspace profit and date filters.
- [ ] Run live HTTPS/security-header, private S3/export, backup/restore, alert and deploy checks.
- [ ] Build/sign an APK with the final beta host; test sign-in, navigation, CSV download and offline/reconnect on a physical device.
- [ ] Review accessibility, real browser layouts and manual acceptance with the founder.
