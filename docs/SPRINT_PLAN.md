# LotNeeti Sprint Plan

This plan sequences the approved backlog; backlog ticket acceptance criteria remain authoritative.

## Sprint 0 — Foundation
Primary: A01, A02, repository tooling, environment/config conventions, API health check, PostgreSQL/Redis local setup, base CI/check commands, test harnesses, status tracking. Establish the Django/DRF and Next.js TypeScript skeletons without inventing product features.

Exit gate: backend starts against PostgreSQL/Redis; frontend builds and reaches versioned API health endpoint; baseline tests/lint/typecheck are runnable; environment secrets are excluded from Git.

## Sprint 1 — Identity, Workspaces, Investors and Accounts
Primary: A03-A07 and B01-B06, B09. Workspace OWNER/OPERATOR/VIEWER separation, Founder Admin, beta authentication, admin MFA, audit service, investor/demat/bank/UPI models and CRUD, applicant priority.

Exit gate: workspace isolation tests pass; sensitive fields follow masking/encryption design; founder admin is distinct from workspace owner.

## Sprint 2 — Balance and Funding
Primary: C01-C10. `+ Add Money`, `- Remove Money`, `Set Balance`, change history, recurring EMI/scheduled debits, funding preferences and cross-funding policy hierarchy.

Exit gate: balance math and recurring-debit idempotency tests pass; user-facing terminology matches UX spec.

## Sprint 3 — IPO and GMP
Primary: D01-D10 plus admin/provider foundations needed for beta. Canonical IPO model, manual/provider interfaces, GMP observations/trend, configurable GMP threshold, manual APPLY/SKIP/reset, IPO category mode.

Exit gate: threshold creates draft selection only; explicit APPLY/SKIP always overrides it; source provenance persists.

## Sprint 4 — Planner v2 Core
Primary: E01-E20. Implement the approved Planner v2 specification as deterministic domain code independent of ORM objects, including quote sizes, cash timeline, rolling limits, owner reserve, higher-GMP ordering, Retail coverage, same-name/funding preference ranking, sHNI upgrades, locks, repair, explanations, persistence and final independent audit.

Exit gate: relevant cases from `Planner_v2_Test_Matrix.md` are automated and green; identical snapshots/config/version produce identical logical output.

## Sprint 5 — Planner UI and Editing
Primary: F01-F09 and required dashboard/planner UX. Selected IPO review, generate plan, editable mappings, Retail/sHNI/lots/demat/bank/UPI changes, lock/unlock, re-plan unlocked rows, blocking warnings, concise explanations.

Exit gate: user can generate, edit, validate and lock a plan without silent corrections.

## Sprint 6 — Import and Export
Primary: B07-B08 and G-series P0 tickets. Import sample-compatible investor/demat/bank/UPI workbooks with preview/errors; export validated plan through adapter-based broker workbook output.

Exit gate: round-trip tests use synthetic workbooks; blocking plan cannot be exported.

## Sprint 7 — Applications, Blocks and Allotment
Implement approved application lifecycle UI/domain: Planned -> Applied/Blocked -> Allotted/Not Allotted, with simple blocked-funds behavior. Recording allotment deducts actual allotted cost from Balance and releases the full application block; not-allotted releases block without changing Balance. Future reusable date follows approved next-day-after-allotment rule.

Exit gate: partial allotment, not-allotted and cash-reuse regression tests pass.

## Sprint 8 — Sale and P&L
Implement sale recording and realized profit using actual allotment cost, quantities, sale proceeds/price and supported charges per approved PRD/backlog. Avoid introducing tax-calculation scope unless specified.

Exit gate: per-investor/IPO/workspace realized P&L tests pass.

## Sprint 9 — Admin, Security and Optional AI
Complete P0/P1 admin/security capabilities required for beta: field overrides, provider health where applicable, policy/config audit, support boundaries, security hardening. Implement AI company/RHP summaries only behind the documented abstraction/configuration so lack of paid API access does not block core beta.

Exit gate: core beta functions without paid AI/data integrations; privileged changes are auditable.

## Sprint 10 — Android and AWS Beta Packaging
Add Capacitor Android beta packaging and infrastructure/deployment assets compatible with the approved low-cost AWS topology. Do not purchase services or create chargeable infrastructure without explicit human action.

Exit gate: Android build instructions/assets exist; deployment is reproducible; secrets are externalized; backup/restore procedure documented.

## Sprint 11 — Final Validation
Run full automated suites, planner regression matrix, migrations from empty DB, synthetic demo seed, import/export flow, security/static checks, frontend production build and the complete demo flow: registration -> investor -> bank -> balance -> IPO -> plan -> edit -> export -> block -> allotment -> sale -> P&L.

Create `docs/FINAL_HANDOFF.md`. Any real 17-PAN historical cases require sanitized/synthetic fixtures unless the human explicitly supplies safe test data.
