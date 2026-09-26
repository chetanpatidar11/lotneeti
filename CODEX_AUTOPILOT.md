# LotNeeti Autonomous Development Runbook

You are the autonomous implementation agent for LotNeeti.

Read `AGENTS.md`, `docs/SPRINT_PLAN.md`, all files in `docs/reference_md/`, and `docs/exec-plans/STATUS.md` before continuing work.

## Objective
Build the complete LotNeeti founder beta from the approved specifications and backlog. Proceed sprint by sprint without waiting for human approval between tickets or sprints. The human intends to perform manual acceptance testing after the complete beta is ready, so automated tests and verification must be performed continuously by you.

## Resume behavior
Repository state is persistent memory. At the start of every invocation:
1. inspect `git status`, current branch and recent commits;
2. read `docs/exec-plans/STATUS.md`;
3. inspect any partially implemented current ticket;
4. continue the exact next action instead of restarting finished work.

If `codex/autopilot` does not exist, create it from `main`. Work only on that branch. Never merge to `main` automatically.

## Ticket loop
For the current sprint, choose the next unfinished required ticket from the approved backlog/dependency order. For each ticket:
1. record current ticket and intended acceptance criterion in `STATUS.md`;
2. implement the smallest maintainable complete change;
3. add/update automated tests and fixtures;
4. run relevant tests, lint and type checks;
5. fix failures;
6. update `STATUS.md` with outcome, decisions, migrations and next action;
7. commit a coherent green milestone, including the backlog ticket ID in the commit message;
8. immediately continue to the next ticket while usage remains.

At each sprint boundary run all currently available backend tests, frontend tests, lint, typecheck, production frontend build, migration checks, and planner regression tests where applicable. Do not intentionally defer known failing tests to a later sprint.

## Blockers
Do not stop for routine naming, styling, package selection, refactoring, or implementation choices. Follow the approved architecture and choose the simplest maintainable option.

Mark BLOCKED only when continuing safely requires an unavailable secret/credential, a paid external service, destructive production access, a licensing decision, or a truly missing product rule. Record the blocker and continue all independent work.

For external data sources (IPO/GMP), implement provider interfaces and manual/sample providers first. Do not scrape or redistribute sources whose commercial permission is not established.

## Usage/billing
Do not configure or use an OpenAI API key for this autonomous runner. Do not purchase credits or enable paid usage. If plan allowance is unavailable, leave the repository safe and resumable; the next scheduled invocation will retry.

## Security
Never commit secrets or real personal/financial data. Use obviously synthetic investor/PAN/bank/UPI values in tests and seed data. Preserve masking, encryption, workspace scoping, MFA and audit requirements from the approved security specification.

## Final state
When all founder-beta P0 work and required sprint gates are complete, run full validation from a clean database and document `docs/FINAL_HANDOFF.md` containing:
- implemented features;
- exact automated test/build results;
- local setup and seed/demo instructions;
- fake demo credentials/data only;
- known limitations and external-service blockers;
- AWS/Android deployment instructions;
- complete manual acceptance checklist;
- last green commit.

Then update `STATUS.md` to COMPLETE and stop.
