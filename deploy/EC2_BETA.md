# Lean EC2 beta deployment

This is an operator runbook; no AWS resource is created by this repository. Use one small EC2 host for PostgreSQL, Redis, Django/Gunicorn, Celery worker/beat and Next.js behind Nginx. Keep PostgreSQL, Redis, Gunicorn and Next.js bound to loopback. Open only SSH (restricted operator source), HTTP for certificate/redirect, and HTTPS to the public network.

## Prepare the host

Install Python 3.12+, PostgreSQL 17 server/client, Redis, Node.js 22, Nginx and a TLS certificate for the beta domain. Create an unprivileged `lotneeti` user and place the reviewed checkout at `/opt/lotneeti` owned by that user. Create `/var/lib/lotneeti` for Celery Beat and `/etc/lotneeti` for root-controlled environment files. PostgreSQL and Redis must be enabled locally before the app units start. Create the application PostgreSQL role/database with a strong external password; do not use the development Compose trust-auth setup.

Create `/etc/lotneeti/app.env` with mode 0600, readable by the service user through systemd. Supply all required production settings: `DJANGO_SETTINGS_MODULE=config.settings.prod`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `FRONTEND_BASE_URL`, SMTP settings, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST=127.0.0.1`, `POSTGRES_PORT`, `POSTGRES_SSLMODE` as appropriate for the local connection, `REDIS_URL`, `PLANNER_PLATFORM_CROSS_FUNDING_POLICY`, `EXPORT_S3_BUCKET`, and `API_BASE_URL=http://127.0.0.1:8000/api/v1`. Use an EC2 instance role for S3 access; do not store AWS keys in the environment file. The host must have a private exports bucket and a private backup bucket configured before external beta use.

Install the four application unit files in `deploy/systemd/` under `/etc/systemd/system/`, reload systemd and enable them. Render `deploy/nginx/lotneeti.conf.template` by replacing `__DOMAIN__` with the actual beta hostname, install it under `/etc/nginx/sites-enabled/`, check with `nginx -t`, then reload Nginx. The certificate paths in the template must exist first. Nginx and Gunicorn access logs omit raw request URLs because login and other queries may carry private values; the Django request logger emits route patterns and status instead.

## Deploy a reviewed revision

Update the checkout to the reviewed commit as the `lotneeti` user. Run `bash /opt/lotneeti/deploy/deploy.sh` as root. The script installs backend dependencies, runs `npm ci` and a production build, checks Django production configuration, applies migrations, collects static assets, restarts the four app services and verifies they are active. It does not pull or merge code. Check `https://<beta-domain>/api/v1/health/`, sign-in, a planner preview and an export download with synthetic data. If a deploy fails, inspect the four unit journals, repair the failure and rerun the same script; preserve the previous reviewed revision for rollback.

Enable the backup timer only after following `deploy/BACKUPS.md` and completing a real isolated restore drill. Configure budget alerts before leaving chargeable resources running. The deployment and AWS checks have not been run in this development environment.
