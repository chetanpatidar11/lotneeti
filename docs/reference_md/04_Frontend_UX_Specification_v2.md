# 04_Frontend_UX_Specification_v2

LotNeeti Frontend & UX Specification

Simple, mobile-first IPO operations for non-technical Indian users

Version 2.1 • Approved Planner baseline • September 2026

# 1. UX North Star

The user should think in plain operational terms: Which IPOs am I applying to? Which PANs are covered? Which bank/UPI will fund each row? How much money is blocked/planned/free? The interface must hide optimizer jargon while still explaining why a row was chosen or why it is blocked.

| Interaction principle: Every automated decision is reviewable. Every plan mapping can be changed. The UI warns immediately and never silently reverts a manual choice. |
| --- |

# 2. Navigation

| Primary tab | Purpose |
| --- | --- |
| Home | Capital cards, action items, active IPOs, allotment/profit summary. |
| IPOs | Upcoming/open issues, GMP history, quick company analysis, select/apply decision. |
| Planner | Selected IPOs, application strategy, generated mappings, edits and exports. |
| Funds | Banks, balances, blocks, recurring debits, funding preferences. |
| Applications | Submitted/blocked/allotment/share-credit tracking. |
| Portfolio | Sales and realized P&L. |
| Settings | Investors, demats, imports, workspace rules, user preferences. |

# 3. Onboarding

1.  Create workspace.

2.  Add investors manually or import the approved Excel template.

3.  Confirm each investor’s demat, bank, UPI and applicant priority.

4.  Set current bank balances.

5.  Optionally add recurring EMIs and preferred cross-funding banks.

6.  Set GMP auto-select threshold (default can be suggested; founder workspace uses 20%).

# 4. Home Dashboard

Use the visual direction from the preferred prototype: large cards with one number and one clear subtitle. Avoid dense charts on the first screen.

| Card | Example |
| --- | --- |
| Total Balance / Portfolio Capital | ₹4,75,000 |
| Blocked in Mandates | ₹1,28,400 |
| Planned / In-Flight | ₹14,400 |
| Free Available Capital | ₹3,32,200 |
| Active IPOs | 4 Issues |
| Total Applications | 8 |
| Pending Mandates | 0 Action Required |
| Allotment Wins | 0 Allotted |
| Realized Gains | +₹0 |

# 5. IPO List and Selection

Each IPO card should show issue name/type, lot/price, close date, GMP ₹ and %, GMP trend, quick analysis link and current selection state.

| State | UI behavior |
| --- | --- |
| Auto-selected | Checkbox ON + badge “Auto: GMP rule”. |
| Below threshold | Checkbox OFF unless user selected manually. |
| Manual Apply | Checkbox ON + badge “Manual”. Persists through GMP changes. |
| Manual Skip | Checkbox OFF + badge “Skipped”. Persists even if GMP rises. |
| Reset to automatic | Returns decision to workspace GMP rule. |

# 6. Plan Creation

The preferred desktop layout can keep the prototype’s two-column structure: selected IPOs on the left, allocation/strategy controls on the right. Mobile turns these into stacked steps.

| Control | Behavior |
| --- | --- |
| Selected IPOs | Only final selected IPOs are sent to planner. |
| Capital view | Show current total/blocked/planned/available; do not force a separate capital budget unless user chooses one. |
| IPO mode | Retail Only / Retail + sHNI / sHNI Preferred / Custom. |
| Generate Plan | Runs Planner v2 and lands directly on editable mapping table. |

# 7. Plan Review / Editable Mapping

## 7.1 Desktop columns

| Column | Editable? | Notes |
| --- | --- | --- |
| IPO | No | Grouped/clearly labelled by priority/GMP. |
| Applicant | Yes | Changing applicant revalidates duplicate PAN/eligibility. |
| Priority | View | Shows applicant priority used when resources are scarce. |
| Category | Yes | Retail or sHNI; never both. |
| Lots | Yes | Amount recalculates immediately. |
| Demat | Yes | Select from active demats. |
| Bank | Yes | Shows balance/available and owner. |
| UPI | Yes | Shows handle + bank; validates limits/verification. |
| Funding | View | Own / Preferred cross-fund / Other cross-fund. |
| Status | View | Ready / Warning / Blocking. |
| Lock | Yes | Locked row survives re-plan unchanged. |

## 7.2 Change Mapping drawer

- Bank list shows owner, masked account, current Balance, Blocked, Planned and Available.

- Own/same-name options appear first, then configured preferred cross-funders, then other allowed wallets.

- Cross-funded choices are not hidden; they show a clear “Cross-funded” warning.

- Ineligible choices remain visible only when useful for explanation, with a reason such as insufficient funds or rolling limit reached.

- After any edit, show immediate PASS / WARNING / BLOCKED validation summary.

# 8. Applicant Priority UX

Replace tax terminology entirely. Investor settings expose a simple numeric Planning Priority. Lower numbers are handled first when cash/UPI/sHNI capacity is scarce.

# 9. Funding Preferences UX

Under each beneficiary investor, provide “Preferred funding accounts” with drag/reorder or numeric priority. Own feasible wallet remains first by default, followed by the ordered cross-funding list, then other allowed wallets.

Mother
Own account                         Default
Wife - HDFC ••••1234               Priority 1
Chetan - SBI ••••7821              Priority 2
Other eligible accounts            Fallback

# 10. Bank Balance UX

Do not expose ledger/reconciliation terminology. The bank card should center on one current balance and three obvious actions.

Wife HDFC ••••1234
Balance       ₹50,000
Blocked       ₹15,000
Planned       ₹15,000
Available     ₹20,000

[ + Add Money ]   [ - Remove Money ]   [ Set Balance ]

A small “Recent changes” section may show date, description, +/- amount and balance after change. The user never needs to calculate a new full balance if they only know the change.

## 10.1 Recurring debit UX

Add recurring expense
Bank:      HDFC ••••1234
Name:      Home Loan EMI
Amount:    ₹42,500
Repeat:    Monthly
Debit day: 5
Start:     05 Oct 2026
End:       No end date
[Save]

# 11. Warnings and Language

| Technical condition | User-facing copy |
| --- | --- |
| INSUFFICIENT_BALANCE | ₹15,000 more is needed in this bank for this application. |
| UPI_LIMIT_EXCEEDED | This UPI has reached its current application limit. |
| BANK_LIMIT_EXCEEDED | This bank account has reached its current application limit. |
| CROSS_FUNDING | This application uses another person’s funding account. |
| OWNER_CASH_CONFLICT | Using this bank here may leave its owner short for another selected IPO. |
| LOCKED_ROW_INFEASIBLE | You locked this mapping, but it cannot currently be submitted. Fix the highlighted issue. |

# 12. Export Flow

1.  Plan must pass blocking validation before “Ready to export” state.

2.  Choose export format.

3.  Preview row count, total amount and warnings.

4.  Generate Excel/CSV; store privately and provide short-lived download.

5.  Mark export version on the plan so later edits are distinguishable.

# 13. Application and Allotment Tracking

| Status/action | UI behavior |
| --- | --- |
| Submitted | Show submitted time and amount. |
| Blocked | Move amount from available into Blocked; Balance itself remains unchanged. |
| Not allotted | One action: Not Allotted → block removed, Balance unchanged. |
| Allotted | Enter/confirm quantity and actual cost → deduct cost, remove full block. |
| Partial allotment | Deduct actual cost, release remainder automatically. |
| Shares credited | Optional confirmation before sale tracking. |

# 14. Profit UX

- Record sale quantity, price, date and optional charges.

- Show gross proceeds, IPO cost, charges, realized profit and ROI.

- Aggregate by IPO, investor and workspace period without presenting tax-return calculations.

# 15. Mobile / Accessibility Details

- Large tap targets and bottom-sheet selectors for bank/UPI/demat mapping.

- Indian number formatting (₹1,28,400) and explicit dates/times.

- Do not rely on color alone; warnings include icon + label + text.

- Support keyboard navigation on web and accessible form labels.

- Keep core copy in simple English; architecture should allow future Indian-language localization.

# 16. Admin UX

- Admin home is exception-oriented: provider stale/error, source conflicts, unpublished AI drafts, blocking user support issues.

- IPO and GMP manual overrides show original source value, effective override, reason, actor and expiry where applicable.

- Founder Admin can manage all beta functions from one staff interface even though permissions are separated underneath.
