# LotNeeti founder beta handoff — draft, not release approval

Updated 2026-09-27. The local implementation and automated gate are green, and the single-host AWS beta is live at `https://44-192-105-250.sslip.io/`. Email sign-in, the approved platform funding policy, founder-supplied product inputs and Android/device acceptance remain gates. This is a founder test environment, not production approval. No OpenAI API or paid external API was used; no real PAN or bank data was loaded.

## 1. Fully complete locally

- A01-A08 foundation, including platform/workspace feature-flag resolution.
- B01-B09 investor, demat, bank, UPI, priority and inactive-applicant behavior.
- B07/B08 account import using the supplied synthetic `docs/samples/AccountImportTemplate.xlsx`: exact sheet and eight-column contract, bounded workbook XML parsing, encrypted preview batch, masked row review, row errors, selected-row confirmation, workspace scoping and viewer read-only behavior. The supplied CDSL/NSDL rows illustrate the format but repeat a PAN; both are rejected until the data is made unique. Existing workspace PANs are rejected too.
- C01-C10 Balance, Scheduled Payments/EMI and funding preferences/policy resolution.
- D01-D14 manual IPO/GMP providers, selection, overrides, provider health and content governance.
- E01-E20 Planner v2 core, deterministic snapshots, locks, repair, explanations, audit and preview.
- F01-F09 plan review/editing/validation and plain-language blocking/warning presentation.
- G01/G02/G04/G05 versioned generic CSV export, readiness checks, private-storage adapter and export metadata.
- H01-H07 application tracking, blocks, actual-cost allotment, partial allotment and dated history.
- I01-I03 sales, realized P&L, split-sale cost allocation and reports.
- J01-J08 responsive shell, dashboard, IPO/planner UX, formatting and accessibility code baseline.
- K01/K03-K07 Founder Admin, overrides, GMP health/corrections, AI content review, policies and redacted support lookup.
- L01-L12 implementation assets and tests. L06-L08/L11/L12 live cloud checks and the real restore drill passed; founder sign-in and manual acceptance remain open.
- M01/M02/M04/M05/M06 Planner matrix mapping, synthetic 17-applicant fixture, frozen snapshots, synthetic API flow and privacy-safe beta events.

## 2. Automated evidence

Run from the repository root:

```bash
bash scripts/check.sh
```

The postdeployment local gate passed with 275 backend tests, 20 frontend tests and 1 Android package test. It also passed all 115 Planner v2 P0 and 5 P1 matrix mappings, Ruff check/format, Django checks, migration drift, frontend lint/typecheck/production build and Capacitor typecheck/build/sync.

Fresh migration verification:

```bash
LOTNEETI_TEST_DB=/private/tmp/lotneeti-fresh.sqlite3 \
  .venv/bin/python backend/manage.py migrate --noinput --settings=config.settings.test
```

The synthetic API scenario covers IPO APPLY, plan preview/edit/lock, generic CSV export, submission/block, partial allotment, sale and realized profit. The AWS host applied all 51 PostgreSQL migrations, passed `manage.py check --deploy`, built Next.js, performed a real encrypted S3 backup and isolated restore, and passed HTTPS/API/frontend connectivity checks. Remote CI, APK compilation and physical-device acceptance remain unverified.

## 3. Exact local setup and application commands

Prerequisites: Python 3.12+, Node.js 22+ and Docker Compose.

```bash
cd /Users/chetanpatidar/Projects/lotneeti-new
cp .env.example .env
# Edit .env: set a random local DJANGO_SECRET_KEY and choose ALLOW, WARN or DISALLOW.
python3 -m venv .venv
.venv/bin/python -m pip install -e 'backend[dev]'
npm ci --prefix web
npm ci --prefix mobile
docker compose up -d postgres redis
.venv/bin/python backend/manage.py migrate
```

Terminal 1, Django API:

```bash
cd /Users/chetanpatidar/Projects/lotneeti-new
PLANNER_PLATFORM_CROSS_FUNDING_POLICY=ALLOW \
  .venv/bin/python backend/manage.py runserver 127.0.0.1:8000
```

Terminal 2, Next.js web app:

```bash
cd /Users/chetanpatidar/Projects/lotneeti-new
API_BASE_URL=http://127.0.0.1:8000/api/v1 \
  npm run dev --prefix web
```

Open `http://127.0.0.1:3000`. Local email sign-in links print in the Django terminal. Create a synthetic founder account with `createsuperuser`, then run:

```bash
.venv/bin/python backend/manage.py enroll_founder_totp founder@example.test
```

Use only synthetic PANs such as `TESTX0001A`, fake account numbers and `person@example.test` addresses. The account-import manual flow and sample contract are documented in [`docs/manual-acceptance/OPEN_GATES.md`](manual-acceptance/OPEN_GATES.md).

## 4. Remaining blocked work

- G03: `docs/samples/` contains the account import `.xlsx`, but no broker workbook. [`docs/samples/BrokerExportMapping.template.csv`](samples/BrokerExportMapping.template.csv) has only headings and a blank row, so it defines no destination columns. Generic CSV is complete. Supply the approved broker workbook and filled mapping, then implement and compare the exact adapter output as described in [`docs/manual-acceptance/OPEN_GATES.md`](manual-acceptance/OPEN_GATES.md).
- K02: the approved documents require stale/conflicting IPO/GMP exceptions to be reviewed, but define no stale age, conflict tolerance, source precedence or selection consequence. Do not invent these rules. Fill the decision worksheet in [`docs/manual-acceptance/OPEN_GATES.md`](manual-acceptance/OPEN_GATES.md), then implement and test the approved rule.
- M03: 15–25 founder-approved sanitized historical expected plans and mappings are missing. Use [`docs/samples/historical-golden-plan.template.json`](samples/historical-golden-plan.template.json); synthetic snapshots cannot substitute for founder approval.
- Platform cross-funding: the approved documents do not choose the platform default. Set `PLANNER_PLATFORM_CROSS_FUNDING_POLICY` explicitly before planning.
- Email sign-in: the host has explicit SMTP placeholders because no existing no-cost SMTP account was supplied. Configure a real SMTP server and credentials in `/etc/lotneeti/app.env` outside Git, restart `lotneeti-api.service`, and verify delivery before inviting testers. Public sign-in currently cannot send links.
- Android: the HTTPS beta host is now reachable, but Java/Android SDK, APK compilation/signing and physical-device acceptance remain open. The current package is a hosted-site launcher, not a bundled offline client.
- Git metadata is read-only in this session, so these changes remain uncommitted in the writable worktree.

## 5. Exact manual acceptance steps

1. After SMTP and the platform funding policy are configured, open `https://44-192-105-250.sslip.io/` (or run the local setup above).
2. Sign in with a synthetic email; verify sign-out and single-use link behavior.
3. Create two workspaces, add OWNER/OPERATOR/VIEWER members and verify cross-workspace reads/writes fail.
4. Upload the sample workbook from Settings and verify both repeated-PAN rows show errors. Make a local copy with unique synthetic PAN, bank and UPI values in the same columns; review masked values, leave one valid row unchecked, confirm, set imported bank Balance and verify the UPI remains unverified.
5. Create/edit a synthetic investor, demat, bank and UPI manually; verify masking and numeric priority order.
6. Exercise Add Money, Remove Money, Set Balance and Scheduled Payments/EMI. Verify Balance, Blocked, Planned and Available.
7. As Founder Admin, create/publish a manual IPO and GMP observation. Test threshold selection, manual APPLY, manual SKIP and Reset to automatic.
8. Choose each IPO mode, generate a plan, edit applicant/category/lots/demat/bank/UPI, lock a row, re-plan unlocked rows and inspect explanations/warnings.
9. Verify a blocking plan cannot export, then export a ready plan as generic CSV and check row order, identifiers, category, lots, amount and total.
10. Track Submitted and Blocked applications; record not allotted, full allotment and partial allotment; verify next-day cash reuse.
11. Record split sales and charges; verify realized profit, ROI and IPO/investor/workspace date filters.
12. Run browser keyboard/focus checks and a screen-reader pass; warnings must have icon, label and text.
13. Complete the G03, K02 and M03 supplied-input steps before calling the beta product complete.

## 6. Exact Android APK commands

Requires Node 22+, Java, Android Studio, Android SDK API 36 and a deployed HTTPS site.

```bash
cd /Users/chetanpatidar/Projects/lotneeti-new/mobile
npm ci
npm run test
npm run typecheck
VITE_LOTNEETI_WEB_URL=https://44-192-105-250.sslip.io npm run android:sync
cd android
./gradlew assembleDebug
```

The debug APK is `mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Install for device testing with:

```bash
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

For a release APK, create a private keystore outside Git, configure Gradle signing locally, run `./gradlew assembleRelease`, and keep the keystore/passwords outside the repository. On a device verify launch, sign-in, navigation, CSV download, session return, offline/reconnect behavior and the final HTTPS host. Do not build against `https://beta.example.invalid`.

## 7. Live AWS founder beta

### Public URL and budget

- URL: `https://44-192-105-250.sslip.io/` (temporary DNS tied to public IPv4 `44.192.105.250`). The certificate expires 2026-12-26; Certbot renewal dry run passed and a renewal hook reloads Nginx.
- AWS account `497502378741`, region `us-east-1`. The founder explicitly allowed the existing root CLI session for infrastructure setup in this student account. Application S3 access uses the one scoped EC2 role, with no AWS keys on the host. The already existing account-wide `lotneeti-staging-monthly` USD 80 monthly budget received an ACTUAL >25% (USD 20) email alert to `chetanpatidar1011@gmail.com` before chargeable resources were created; both notification and subscriber were read back from AWS.

### Exact AWS resources created

- CloudFormation `lotneeti-beta-storage`: private buckets `lotneeti-beta-497502378741-us-east-1-exports` and `lotneeti-beta-497502378741-us-east-1-backups`, each with a bucket policy blocking plaintext/insecure uploads, all four public-access blocks and AES256 default encryption. IAM role `lotneeti-beta-storage-BetaInstanceRole-r7SzKQexYkXg` and instance profile `lotneeti-beta-storage-BetaInstanceProfile-tNBzy9G3HeQU` have only managed policies `lotneeti-beta-storage-ExportAccessPolicy-OeENXfXOqSPH` and `lotneeti-beta-storage-BackupAccessPolicy-mgORcvGPUeYl` for the `exports/` and `backups/postgres/` prefixes.
- CloudFormation `lotneeti-beta-host-active`: VPC `vpc-077af0b2864e9141a`, public subnet `subnet-0a460d17795032ae9`, internet gateway `igw-053b4936f929b5c91`, route table `rtb-05b87d428b1ce8214`, subnet route association `rtbassoc-059ac31374b37579d`, security group `sg-0def099f971811fba`, EC2 `i-02def39354f6c2377` and encrypted 30 GB gp3 volume `vol-049debf49fe68a75b`. The `t4g.small` runs Ubuntu 24.04 arm64 with standard CPU credits. SSH is restricted to `94.207.192.250/32`; ports 80 and 443 are public. The failed initial stack `lotneeti-beta-host` was deleted and created no instance.
- Tagged imported EC2 SSH key pair `key-0511fab53cceabcc3` (`lotneeti-beta-20260927`). Its private key is outside Git at `/private/tmp/lotneeti-beta-keys/lotneeti-beta-20260927`; a separate encrypted recovery copy is SSM SecureString `/lotneeti/beta/operator-ssh-private-key`, version 1. Move the working key to durable private local storage before temporary files are cleaned.
- Standard SSM SecureStrings `/lotneeti/beta/backup-encryption-key` and `/lotneeti/beta/django-secret-key`, both version 1, hold separate encrypted recovery copies of the PostgreSQL backup and Django field-encryption keys. Decryption/recovery comparisons succeeded without printing their values. The EC2 role has no SSM read permission.
- All supported resources carry `Project=LotNeeti` and `Environment=Beta`. No RDS, ECS/Fargate, load balancer, NAT Gateway, managed Redis, domain purchase, OpenAI API or paid external API was created or used.

### Verification

- The host built Next.js, passed Django `check --deploy`, applied all 51 migrations (including `core.0003_featureflag` and `investors.0003_accountimportbatch`), and collected static assets. Django/Gunicorn, Next.js, Celery worker/beat, PostgreSQL, Redis and Nginx are active. PostgreSQL/Redis listen only on loopback.
- HTTPS certificate trust passed; HTTP redirects 301. `GET /api/v1/health/` returns HTTP 200 and `{"status":"ok","service":"lotneeti-api","apiVersion":"v1"}`. `/sign-in` returns HTTP 200. The homepage renders `API connected`, and the unauthenticated frontend workspace proxy returns 403 through Django. Nginx adds HSTS, nosniff, frame denial, Referrer-Policy and COOP to frontend and API responses. `certbot renew --dry-run --no-random-sleep-on-renew` passed.
- The EC2 role wrote and read a synthetic AES256 private export and generated a working five-minute signed download. An unsigned request returned HTTP 403. The test export was deleted. Negative role checks denied account-wide bucket listing, backup writes outside `backups/postgres/`, and SSM secret reads.
- `lotneeti-backup.service` uploaded real encrypted S3 archives: `backups/postgres/daily/2026-09-27.dump.gcm`, `weekly/2026-W39.dump.gcm`, and `monthly/2026-09.dump.gcm`. Each is 141338 bytes with S3 AES256 encryption. The daily archive was authenticated and restored into the isolated database `lotneeti_restore_20260927` using PostgreSQL server/client 17.11. Live and restore counts matched: 51 migrations, 0 workspaces, 0 plan runs, 0 applications and 0 sales. The isolated database was dropped after recording the drill. The backup timer is enabled/active for 02:00 Asia/Kolkata nightly (next run observed 2026-09-28 02:00 IST); retention is 7 daily, 4 weekly and 3 monthly objects.
- Local checks before deployment passed 274 backend tests; after deployment asset updates they passed 275 backend tests, 20 frontend tests, 1 Android package test, Planner matrix, lint, typecheck, migration drift and builds. The workstation redeploy script was exercised successfully against the live host; its final code/deploy archive SHA-256 was `8d54fd49edc6252ddc21781fbf748fc0f9b9fdaf24fe72f4579ad036b7408a9c`. The source base commit is `e16e411` plus uncommitted current-worktree fixes.

### Estimated recurring AWS usage

At 730 hours/month before credits, taxes, transfers and variable S3/KMS requests: `t4g.small` about USD 12.26 (AWS Pricing API returned USD 0.0168/hour), 30 GB gp3 about USD 2.40, and one public IPv4 about USD 3.65, or about USD 18.31/month plus small S3 usage. AWS currently offers a shared 750-hour/month `t4g.small` free trial through 2026-12-31; if this account has those hours available, instance-hour charges may be covered, leaving roughly USD 6.05/month plus S3/transfer/tax. Standard SSM Parameter Store has no additional monthly parameter charge; KMS requests may apply. The account-wide USD 20 alert is a notification, not a hard spending limit.

### Exact process for later code updates

From the current workstation, keep the SSH private key and known-hosts file outside Git. Review the worktree and run the local gate first:

```bash
cd /Users/chetanpatidar/Projects/lotneeti-new
bash scripts/check.sh
LOTNEETI_KNOWN_HOSTS=/private/tmp/lotneeti-beta-known-hosts \
  bash deploy/push-from-workstation.sh \
  44.192.105.250 \
  /private/tmp/lotneeti-beta-keys/lotneeti-beta-20260927 \
  44-192-105-250.sslip.io
```

The tested script archives the current `backend/`, `web/` and `deploy/` worktree without secrets/build directories, syncs source to `/opt/lotneeti`, installs the reviewed Nginx/systemd/renewal assets, runs `nginx -t`, installs Python and Node dependencies, builds Next.js, runs Django production checks and migrations, collects static files, restarts the four app services and checks HTTPS health. Environment files stay under `/etc/lotneeti/` outside Git. Preserve a previous reviewed source checkout for rollback; the script does not reverse database migrations. If the instance public IP changes, the temporary DNS name, certificate, host environment URLs and SSH security-group CIDR must be updated before using this command.

### Remaining deployment blockers

- `/etc/lotneeti/app.env` contains SMTP placeholders; no mail provider or paid API was configured. Public email sign-in cannot deliver links. Add an existing approved no-cost SMTP host/user/password and sender privately on the host, restart `lotneeti-api.service`, then verify actual delivery without exposing the password in chat or Git.
- `PLANNER_PLATFORM_CROSS_FUNDING_POLICY` is unset because the approved documents do not choose ALLOW, WARN or DISALLOW. Set the founder-approved value in `/etc/lotneeti/app.env` and restart API/worker/beat before planner testing.
- G03 broker workbook/mapping, K02 freshness/conflict rules, M03 approved historical plans and Android/device manual acceptance remain as listed above. No real financial data has been loaded. Do not call this environment production-ready or invite testers until sign-in and these relevant gates are resolved.
