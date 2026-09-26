# AGENTS.md — LotNeeti

## Mission
Build the approved LotNeeti founder-beta product from the repository specifications. Work autonomously, one ticket at a time, while keeping the repository green. The human will do manual acceptance testing after the beta is complete; automated verification is required throughout.

## Source of truth
Read these before architectural or business-rule changes, in this order:
1. `docs/reference_md/Planner_Algorithm_v2_Specification.md`
2. `docs/reference_md/Planner_v2_Test_Matrix.md`
3. `docs/reference_md/05_Feature_Ticket_Backlog_v2.md`
4. `docs/reference_md/01_Product_Requirements_Document_v2.md`
5. `docs/reference_md/02_Technical_Architecture_Django_AWS_v2.md`
6. `docs/reference_md/03_Security_Access_Admin_Specification_v2.md`
7. `docs/reference_md/04_Frontend_UX_Specification_v2.md`
8. `docs/SPRINT_PLAN.md`
9. `docs/exec-plans/STATUS.md`

Original approved DOCX files are retained under `docs/reference/`.

If documents appear to conflict, Planner v2 governs planner behavior, the Security spec governs security/access, the Technical Architecture governs implementation structure, and the backlog acceptance criteria govern ticket completion. Do not invent product rules to fill material gaps; record a blocker in `STATUS.md` and continue independent work.

## Stack
Use the approved modular-monolith direction: Django + Django REST Framework, PostgreSQL, Redis/Celery, Next.js + TypeScript, and Capacitor for Android. Keep deployment compatible with the lean AWS beta architecture. Prefer simple, maintainable implementations over premature scale.

## Working rules
- Work from `codex/autopilot`; never automatically merge to `main`.
- Maintain `docs/exec-plans/STATUS.md` before/after meaningful tickets.
- Work on one ticket at a time using backlog IDs.
- Run relevant tests after every meaningful change; fix regressions before proceeding.
- At sprint boundaries run the complete available backend/frontend test, lint, typecheck, migration, and build gates.
- Commit coherent green milestones with ticket IDs in messages.
- Use deterministic synthetic fixtures only. Never commit real PANs, bank accounts, UPI IDs, passwords, tokens, AWS secrets, API keys, `.env`, or production data.
- Preserve workspace isolation and encryption/masking requirements from the security spec.
- Planner output must remain deterministic for identical versioned input/configuration.
- Manual locks and manual IPO APPLY/SKIP decisions outrank automation as specified.

## Product-language rule
User-facing copy stays simple: Balance, Blocked, Planned, Available; + Add Money, - Remove Money, Set Balance; Scheduled Payments/EMI. Do not expose accounting/reconciliation/optimizer jargon where the UX specification avoids it.

## Completion
A ticket is complete only when its acceptance criterion is implemented and verified. A sprint is complete only when all required P0 tickets assigned to it are green. Final completion requires `docs/FINAL_HANDOFF.md` with setup, test evidence, demo flow, known limitations, external blockers, deployment steps, and a manual acceptance checklist.
