# PostgreSQL backup and restore

The backup timer is designed for the beta EC2 host. It has not been connected to AWS in this development workspace. Use a private S3 bucket and an instance role with only the required backup prefix permissions before enabling it.

## Host configuration

Install PostgreSQL client tools matching the server major version, the backend virtual environment, and the two files in `deploy/systemd/`. Install the service and timer under `/etc/systemd/system/`, then enable `lotneeti-backup.timer` after a successful manual run. Set the host timezone to Asia/Kolkata so the 02:00 timer fires after the intended local day; the backup object date is always computed in Asia/Kolkata.

Create `/etc/lotneeti/backup.env` readable only by the `lotneeti` service account and root. It must supply `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` (or another PostgreSQL authentication mechanism), `BACKUP_S3_BUCKET`, `BACKUP_ENCRYPTION_KEY_B64`, and `AWS_DEFAULT_REGION`. Generate the encryption key outside the repository as 32 random bytes encoded in base64. Keep a separate protected copy of that key; losing it makes the backups unrecoverable. Do not place this file in the repository or frontend deployment.

The EC2 instance role needs `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`, and `s3:DeleteObject` only for `backups/postgres/` in the private bucket. Bucket public access must be blocked. The command also requests S3 AES256 server-side encryption. The dump is a compressed PostgreSQL custom archive and is encrypted locally with AES-256-GCM before upload. No plaintext dump is written to disk during backup.

Run `sudo systemctl start lotneeti-backup.service` once, inspect the service result, and verify the three encrypted objects under `backups/postgres/daily/`, `weekly/`, and `monthly/`. Then enable the timer. Each successful run keeps the latest 7 daily, 4 weekly, and 3 monthly objects. A failed dump uploads nothing and does not prune older backups.

## Restore drill

Use an isolated empty PostgreSQL database named `lotneeti_restore_...`. Never point the restore command at the live database. Ensure the backup encryption key and `BACKUP_S3_BUCKET` are available to the restore process, set `RESTORE_S3_KEY` to a selected `backups/postgres/...dump.gcm` object and `RESTORE_DATABASE` to the isolated database, then run `python -m ops.restore` from `backend/` in the virtual environment. The command authenticates the entire encrypted archive before `pg_restore` runs.

After restore, check that the database contains the expected Django tables, that core workspace, application, plan and sale row counts are plausible, and that read-only critical queries succeed. Record the date, backup object key, PostgreSQL client/server versions, row-count comparison and result in the operations log. Drop the isolated database only after the drill is documented. A real PostgreSQL plus private S3 restore drill remains required before inviting external beta users; fake-client tests alone do not satisfy that operational gate.
