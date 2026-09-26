# 01_Product_Requirements_Document_v2

LotNeeti Product Requirements Document

Website + Android APK for multi-PAN Indian IPO planning, tracking and profit

Version 2.1 • Approved Planner baseline • September 2026

# 1. Executive Summary

LotNeeti is a family/group IPO operations product for users who manage applications across multiple PAN holders, demat accounts, bank accounts and UPI handles. The product helps a user discover and review IPOs, create a funding-aware application plan, export broker-ready files, track blocks and allotments, and calculate realized profit after sale.

| Approved product principle: Automation proposes; the user decides. Every generated IPO selection and every application mapping remains editable before export. Planner Algorithm v2 and its companion test matrix are the authoritative source for planning behavior. |
| --- |

## 1.1 Success definition

- A non-technical user can add investors, banks, demats and UPIs, generate a valid plan and export it without understanding optimizer internals.

- The planner maximizes PAN coverage first, respects user priority and cash/UPI limits, and remains deterministic for identical inputs.

- A user can change bank, UPI, demat, category or lots after planning and immediately see whether the row is valid.

- Balance, blocked funds, planned funds, allotment and profit can be maintained with very simple actions rather than accounting workflows.

- The founder can run the beta alone using a single platform-admin account and AWS student credits.

# 2. Users, Workspaces and Roles

| Persona | Primary need |
| --- | --- |
| Workspace Owner | Manage own/family investor data, planning, exports, tracking, settings and members. |
| Workspace Operator | Daily investor/bank/plan/tracking work without ownership/security administration. |
| Workspace Viewer | Read-only dashboards and reports with sensitive values masked unless permitted. |
| Founder Admin | Platform-wide administration during beta: IPO/GMP data, planner defaults, users, support and security. |
| Future platform staff roles | Data Editor, Planner Admin, Support and Security Admin can be separated later without changing workspace roles. |

For beta, the founder account is both Founder Admin and Workspace Owner. Workspace Owner does not imply platform-wide access for public customers.

# 3. V1 Scope

| Area | V1 requirement |
| --- | --- |
| Investor master | Create/edit investor, PAN, priority, active state and one or more demats/banks/UPIs. |
| Import | Import the supplied account master Excel format and report row-level errors. |
| IPO discovery | Show upcoming/open IPOs, GMP %, issue facts and a short company/financial summary. |
| IPO selection | Auto-select from a workspace GMP threshold; user may manually apply or skip any IPO. |
| Planning | Generate Retail/sHNI application mappings across PANs, banks and UPIs using Planner v2. |
| Plan editing | Change applicant, category, lots, demat, bank, UPI and lock/unlock rows before export. |
| Funding preferences | Per-beneficiary preferred cross-funding banks plus owner-cash protection. |
| Balance | + Add Money, - Remove Money and Set Balance; scheduled recurring debits such as EMI. |
| Export | Excel/CSV adapters; first adapter maps to the uploaded account/broker template where applicable. |
| Tracking | Submitted, blocked, allotted/not allotted, debit/unblock and share credit state. |
| Profit | Record sale quantity/price/charges and show realized P&L by IPO, investor and workspace. |
| Admin | Manage IPO/GMP content, provider health, planner policies, feature flags and AI summaries. |

## 3.1 Explicitly out of V1

- Automatic broker or bank login, OTP capture, mandate approval or IPO submission.

- Bank-statement reconciliation, complex accounting or tax-return preparation.

- Guaranteed investment recommendations or universal “apply” rules for all users.

- Production microservices, Kubernetes or expensive high-availability infrastructure during beta.

# 4. Core User Journey

1.  Create workspace and add/import investors, demats, banks and UPIs.

2.  Set each bank balance using Set Balance, then maintain changes with + or - when convenient.

3.  Optionally set recurring debits such as EMI and preferred cross-funding banks for beneficiaries.

4.  Review open/upcoming IPOs. Workspace GMP threshold produces the draft selection.

5.  Manually select a below-threshold IPO or unselect an above-threshold IPO if desired.

6.  Choose each selected IPO mode: Retail Only, Retail + sHNI, sHNI Preferred, or Custom.

7.  Generate the plan. Review explanations, warnings, owner protection and funding mappings.

8.  Edit any mapping, validate immediately, lock important rows and re-plan unlocked rows if needed.

9.  Export the final broker-ready file and mark applications submitted/blocked.

10.  On allotment, record allotted/not allotted. The system performs debit/unblock automatically.

11.  After sale, enter sale details and review realized profit.

# 5. Approved Planner Rules

| Authority: The detailed Planner Algorithm v2 Specification controls implementation if this PRD is ambiguous. |
| --- |

| Rule | Approved behavior |
| --- | --- |
| One PAN per IPO | At most one application per PAN per IPO; category is Retail OR sHNI, never both. |
| Primary objective | Maximize eligible PAN coverage within the current higher-priority selected IPO before using remaining resources for lower-priority selected IPOs. |
| Retail | Default one lot. |
| sHNI | Minimum whole-lot quote strictly above ₹2,00,000; do not add extra lots just to spend cash. |
| sHNI Preferred | After baseline coverage, create as many feasible minimum-sHNI upgrades as possible. |
| Applicant priority | Direct numeric priority 1, 2, 3...; lower number wins when resources are scarce. No tax ranking. |
| Same-name | Strong preference for own/same-name bank/UPI; cross-funding remains permitted when enabled. |
| Preferred funder | Beneficiary may have ordered preferred funding banks for cross-funding. |
| Owner protection | Before cross-funding, reserve the bank owner’s own baseline needs across overlapping selected IPOs. |
| GMP selection | Workspace threshold creates draft selection; founder default 20%. Manual APPLY/SKIP overrides persist. |
| IPO competition | Among final selected IPOs competing for scarce resources, higher GMP is prioritized. |
| Expected reuse | Funds are assumed reusable from the next calendar day after allotment date; actual allotment state supersedes the assumption. |
| Limits | 24-hour rolling window; default 6 applications and ₹5,00,000 per UPI and bank account. |

# 6. User-Facing Money Model

| Number | Meaning |
| --- | --- |
| Balance | What the user says is currently in the bank. |
| Blocked | Money tied up in current IPO mandates/applications. |
| Planned | Money reserved by a plan but not yet submitted/blocked. |
| Available | Balance minus blocked minus planned for “now”; future planning also considers scheduled debits and expected releases. |

Bank balance maintenance must be simple: + Add Money, - Remove Money, or Set Balance. A small history is kept internally so mistakes can be understood, but no reconciliation workflow is exposed.

## 6.1 Allotment behavior

| Outcome | System action |
| --- | --- |
| Not allotted | Release the full block; Balance does not change. |
| Allotted | Deduct actual allotted cost from Balance and release the full application block. |
| Partial allotment | Deduct actual allotted cost and release the remainder of the block. |

## 6.2 Recurring debit behavior

Users can create a recurring debit with Bank, Name, Amount, Frequency, Day/Date, Start Date, optional End Date and Active/Paused state. The future planner subtracts a due debit before a later IPO cutoff, and on the due date the debit creates a normal negative balance change.

# 7. IPO Discovery and Analysis

The product should replace the need for random five-minute research by presenting a concise factual view: company description, revenue/PAT trend, key ratios, issue structure, use of proceeds, important risks, price/lot/dates and GMP history. AI is used for summarization and extraction, while numeric planning inputs remain deterministic.

## 7.1 GMP behavior

- GMP is an unofficial market indicator and must be source-attributed in the product.

- Store time-series observations rather than only one current number.

- Provider architecture supports ManualGMPProvider during beta and licensed/permitted providers later.

- A workspace may configure its auto-select threshold; manual APPLY/SKIP always wins until Reset to automatic.

# 8. Data Ingestion and Admin

Running the product should be exception management, not manual data entry. IPO/GMP sources are implemented behind adapters. During development and private beta, manual/test providers are acceptable. Before public redistribution, permitted/licensed production feeds must be confirmed.

| Admin capability | Requirement |
| --- | --- |
| IPO master | Correct dates, price band, lot, allotment/listing date, status, issue type, source links and publication state. |
| Field overrides | Store source value and manual override separately so a sync cannot silently overwrite an intentional correction. |
| GMP sources | Enable/disable source, view freshness/errors, correct observation, set temporary override with reason/expiry. |
| AI content | Review/edit generated company summary, financial summary and risk summary with version history. |
| Planner policy | Edit effective-dated global defaults and bank policies with reason/audit trail. |

# 9. Dashboard Requirements

The beta dashboard should follow the simple card direction already preferred in the prototype: Total Balance/Portfolio Capital, Blocked, Planned/In-Flight, Available, Active IPOs, Total Applications, Pending Mandates, Allotment Wins and Realized Gains.

# 10. Non-Functional Requirements

| Requirement | Target |
| --- | --- |
| Usability | Core planning flow usable by a non-technical Indian retail user without optimizer knowledge. |
| Determinism | Identical approved inputs/settings produce the same logical plan. |
| Performance | Typical 20-PAN / 10-bank workspace plan generation target < 3 seconds in beta. |
| Security | Tenant isolation, masked sensitive identifiers, encryption, admin MFA, audit trail and private backups. |
| Availability | Beta may use a single server; graceful error messages and verified backups are mandatory. |
| Explainability | Each automatic row includes human-readable reasons and all blocking conflicts are visible before export. |

# 11. Beta Release Strategy

1.  Beta 0: founder workspace with the real 17-PAN operating setup and historical golden scenarios.

2.  Beta 1: 10-20 invited family/friend workspaces; focus on setup and planning usability.

3.  Beta 2: invitation-only public beta around 100 users; measure activation, plan generation, edits, exports and tracking completion.

4.  Public launch only after data-source rights, privacy/terms, deletion/export, backups, monitoring, admin MFA and support workflow are ready.

# 12. Product Decisions Still Open

- Final public brand/domain. LotNeeti is the working codename; domain purchase is postponed until public beta readiness.

- Production IPO/GMP licensed data providers and redistribution terms.

- Monetization model and free/paid workspace limits.

- Exact Android store release timing; private beta may use a temporary application ID/build.
