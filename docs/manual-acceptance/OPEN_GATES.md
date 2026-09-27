# Open gates and founder supplied inputs

This file is a fill-in worksheet for gates that cannot be completed with local synthetic data. Do not put real PANs, bank numbers, UPI handles, passwords, tokens or cloud keys in this repository. Keep completed worksheets outside Git, or copy only sanitized decisions and results into the handoff.

## B07/B08 account import

The supplied `docs/samples/AccountImportTemplate.xlsx` is a column-format example, not a ready-to-import data file: its CDSL and NSDL rows repeat the same PAN to illustrate the different demat fields. The sheet must be named `AccountImportTemplate` and use this exact header order:

`Name, PAN, Type, DPID, CLIENT ID, UPI ID, Account Number, Bank Name`

`Type` is `CDSL` or `NSDL`. `DPID` is required for NSDL. A CDSL row may leave DPID blank when CLIENT ID contains the complete BO identifier, as in the supplied sample. Imported banks start at Balance 0 and must be set by the user after confirmation. Imported UPIs remain unverified until the user verifies them.

Each PAN may occur only once in an import workbook and may not already belong to an investor in the workspace. Both repeated-PAN sample rows show row errors and cannot be confirmed as supplied. Make a local copy with unique synthetic PANs, account numbers and UPI IDs to test successful multi-row import; keep the same eight columns and sheet name.

Local acceptance:

```bash
cd /Users/chetanpatidar/Projects/lotneeti-new
.venv/bin/python -m pytest backend/tests/test_account_imports.py
bash scripts/check.sh
```

Manual acceptance in the running web app:

1. Sign in to a synthetic workspace and open Settings.
2. Choose `docs/samples/AccountImportTemplate.xlsx` under Import accounts. Verify both sample rows show a duplicate-PAN error and neither can be checked.
3. Make a local copy with unique synthetic PAN, bank account and UPI values in the existing columns; upload it and confirm that PAN, demat, UPI and account values are masked.
4. Leave one valid row unchecked and confirm the other valid row. Confirm only the checked row created an investor, demat, bank and UPI.
5. Reupload the same unique-PAN copy; verify the already-imported PAN now shows an error and cannot be checked.
6. Upload a copy with an invalid PAN and confirm the row error is visible and the invalid row cannot be checked.
7. Set the imported bank Balance and verify the imported UPI is still unverified until manually verified.

## G03 broker workbook mapping

The application has a deterministic generic CSV export. As of 2026-09-27, `docs/samples/` contains one `.xlsx` file, `AccountImportTemplate.xlsx`, for B07/B08. `BrokerExportMapping.template.csv` contains column headings and a blank row only. It does not define any broker destination columns. The broker workbook adapter remains blocked until the broker's approved workbook and mapping are supplied. Fill the mapping outside Git using `docs/samples/BrokerExportMapping.template.csv` and provide:

- the exact workbook file and sheet name;
- destination column names and order;
- required/optional status for every destination column;
- formatting rules for dates, amounts, category and lots;
- whether identifiers must be plaintext, masked or separately approved;
- one sanitized expected output for a two-row synthetic plan.

Acceptance commands after the mapping is approved:

```bash
.venv/bin/python -m pytest backend/tests/test_export_adapters.py backend/tests/test_saved_plan_csv_export.py
bash scripts/check.sh
```

Then add the approved template and adapter tests, run the full gate, and manually compare row order, identifiers, category, lots, amount and total against the broker's acceptance file. Do not connect a real broker account.

## K02 freshness and conflict decision

The approved PRD, security specification, UX specification, Planner v2 specification and backlog require freshness/conflict review but do not define the thresholds or precedence. No default is recorded here. The founder or product owner must supply, in writing:

```text
IPO source stale after: ____ hours
GMP source stale after: ____ hours
Conflict means: same field differs by ____ (absolute/percent/tolerance), or: ____
Required source count before conflict: ____
Conflict severity: warning / blocking / other: ____
Conflict precedence: manual override / source priority / newest observation / other: ____
Missing required IPO fields: ____
Missing required GMP fields: ____
Whether stale/conflicting data may feed selection: yes / no / only after manual APPLY
GMP consensus: eligible sources ____, minimum count ____, aggregation ____, disagreement rule ____
NSE/BSE/SEBI feed permission/schema/redistribution approval references: ____
Decision owner and date: ____
```

After approval, implement the smallest rule-specific tests and admin labels. Until then, keep the exception dashboard rule-free and do not infer freshness from timestamps alone.

## M03 historical golden plans

Use `docs/samples/historical-golden-plan.template.json` once the founder has sanitized each case. Keep PAN aliases such as `PAN-01`, never real PANs. For each case, record the exact snapshot time, selected IPOs, current balances, blocks, debits, limits, preferences, locks, expected mappings, uncovered rows and the reason each expected result is correct.

Manual review:

1. Supply 15–25 sanitized cases covering ordinary, scarce cash, overlapping IPOs, EMI timing, cross-funding, sHNI upgrades, locks and allotment reuse.
2. Review each expected mapping with the founder.
3. Mark intentional differences from Planner v2 with a reason and approval date.
4. Convert approved cases to immutable test fixtures and run `bash scripts/check.sh`.

## Platform policy decision

Planner preview intentionally returns 503 until this environment variable is explicit:

```bash
export PLANNER_PLATFORM_CROSS_FUNDING_POLICY=ALLOW   # or WARN or DISALLOW
```

Choose the policy in the local `.env` and beta environment before manual planning acceptance. No product document supplies a default.

## AWS and backup gates

These steps require AWS credentials, a domain/TLS certificate, a chargeable EC2 host and private S3 buckets. Perform them only when the founder authorizes that spend. The exact runbooks are [`deploy/EC2_BETA.md`](../../deploy/EC2_BETA.md) and [`deploy/BACKUPS.md`](../../deploy/BACKUPS.md). The command sequence is recorded in `docs/FINAL_HANDOFF.md`.

## Android gate

The local package is a hosted-site launcher. A Java/Android SDK installation, reachable HTTPS host, APK build, signing decision and physical-device test are required. Use `mobile/README.md` and the command sequence in `docs/FINAL_HANDOFF.md`.
