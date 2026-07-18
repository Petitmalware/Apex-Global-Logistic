# Deployment

This runbook prepares Apex Global Logistics for an Ubuntu VPS using Docker, Nginx, PostgreSQL, Redis, MinIO, Cloudflare, SSL, automated backups, monitoring, logging, and GitHub Actions CI/CD.

## Target Architecture

- Cloudflare manages DNS, proxying, WAF, and edge TLS.
- Nginx terminates SSL on the VPS and proxies to the Next.js app on `127.0.0.1:3000`.
- Docker Compose runs the app, PostgreSQL, Redis, MinIO, and optional monitoring services.
- PostgreSQL and Redis are private Docker services and are not published to the internet.
- MinIO is bound to localhost by default. Keep the console behind SSH tunnel, VPN, or a separately protected admin hostname.
- App uploads currently persist to local mounted storage at `/app/storage`; MinIO/S3 variables are provisioned for the object storage adapter phase.

## VPS Prerequisites

Use Ubuntu 22.04 or 24.04 with a non-root sudo user.

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw enable
```

## Cloudflare

1. Create `A` and optional `AAAA` records for the production domain.
2. Enable the orange-cloud proxy.
3. Set SSL/TLS mode to `Full (strict)` after the origin certificate is installed.
4. Enable HTTP/2, HTTP/3, Brotli, Always Use HTTPS, and security rules/rate limiting as needed.
5. Refresh origin real IP handling on the VPS:

```bash
sudo deploy/scripts/update-cloudflare-ips.sh
```

Run that script from the project root after cloning, and refresh it periodically.

## First Docker Deployment

```bash
sudo mkdir -p /opt/apex-global-logistics
sudo chown "$USER":"$USER" /opt/apex-global-logistics
git clone <repo-url> /opt/apex-global-logistics
cd /opt/apex-global-logistics
cp deploy/env.production.example .env.production
nano .env.production
mkdir -p backups logs storage
sudo chown -R 1001:1001 storage
chmod +x deploy/scripts/*.sh
deploy/scripts/deploy-docker.sh
```

Important: commit and deploy Prisma migrations before using `npm run db:migrate:deploy` on production. For the very first empty database in a schema-only prototype, run a controlled bootstrap in staging first, then convert the baseline into a committed migration before real production data is accepted.

## MapTiler Tracking

Add the following variables to `/opt/apex-global-logistics/.env.production` before deployment:

```text
NEXT_PUBLIC_MAPTILER_API_KEY=
MAPTILER_API_KEY=
```

Both variables may contain the same MapTiler key. The public variable is embedded into the browser
map during the Docker build, while `MAPTILER_API_KEY` is used only on the server to geocode the
location written by an administrator. Configure the MapTiler key to allow
`apexgloballogistics.net` and `www.apexgloballogistics.net`; `localhost:3000` can be allowed
temporarily for local development. Never add a real MapTiler key to Git or an example file.

## Nginx And SSL

Copy the Nginx template, replace `apex.example.com`, and install SSL:

```bash
sudo cp deploy/nginx/apex-global-logistics.conf /etc/nginx/sites-available/apex-global-logistics
sudo nano /etc/nginx/sites-available/apex-global-logistics
sudo ln -s /etc/nginx/sites-available/apex-global-logistics /etc/nginx/sites-enabled/apex-global-logistics
sudo nginx -t
sudo certbot --nginx -d apex.example.com -d www.apex.example.com
sudo systemctl reload nginx
```

The Nginx template:

- redirects HTTP to HTTPS,
- supports Server-Sent Events without buffering,
- blocks public access to `/api/metrics`,
- sets upload size to `25m`,
- forwards Cloudflare/client headers,
- caches immutable Next.js static assets.

## Monitoring

The app exposes:

- `/api/health` for uptime checks,
- `/api/metrics` for Prometheus scraping inside the Docker network.

Start optional monitoring services:

```bash
docker compose --env-file .env.production -f deploy/docker-compose.prod.yml --profile monitoring up -d
```

Prometheus is bound to `127.0.0.1:9090` and Grafana to `127.0.0.1:3001` by default. Put Grafana behind a protected Nginx server block, VPN, or SSH tunnel before exposing it.

## Logs

Useful commands:

```bash
docker compose --env-file .env.production -f deploy/docker-compose.prod.yml logs -f app
docker compose --env-file .env.production -f deploy/docker-compose.prod.yml ps
sudo tail -f /var/log/nginx/apex-global-logistics.error.log
```

Install log rotation:

```bash
sudo cp deploy/logrotate/apex-global-logistics /etc/logrotate.d/apex-global-logistics
sudo logrotate -d /etc/logrotate.d/apex-global-logistics
```

Docker services also use bounded `json-file` logs with `10m` files and `5` rotations.

## Backups

Run a manual backup:

```bash
deploy/scripts/backup.sh
```

Restore PostgreSQL only after confirming the target environment:

```bash
CONFIRM_RESTORE=yes deploy/scripts/restore-postgres.sh backups/postgres-YYYYMMDDTHHMMSSZ.dump
```

Install the daily systemd backup timer:

```bash
sudo cp deploy/systemd/apex-backup.service /etc/systemd/system/apex-backup.service
sudo cp deploy/systemd/apex-backup.timer /etc/systemd/system/apex-backup.timer
sudo nano /etc/systemd/system/apex-backup.service
sudo systemctl daemon-reload
sudo systemctl enable --now apex-backup.timer
systemctl list-timers apex-backup.timer
```

Edit the service user/path if your VPS user or app directory is not `deploy` and `/opt/apex-global-logistics`.

## PM2 Alternative

Docker is the recommended path because it keeps PostgreSQL, Redis, MinIO, logs, health checks, and backups consistent. If you must run the app with PM2:

```bash
npm ci
npm run build
npm run db:migrate:deploy
mkdir -p logs storage
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

PostgreSQL, Redis, MinIO, Nginx, backups, and monitoring still need to be installed and managed separately.

## CI/CD

Workflows live in `.github/workflows`.

Required production secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`

The deploy workflow SSHes into the VPS, updates `main`, marks deployment scripts executable, and runs `deploy/scripts/deploy-docker.sh`.

## Release Checklist

1. `npm run check`
2. `npm run build`
3. Confirm `.env.production` has production secrets and public URL.
4. Confirm DNS points to the VPS and Cloudflare SSL mode is `Full (strict)`.
5. Confirm `deploy/scripts/healthcheck.sh` passes.
6. Confirm a backup exists before and after deployment.
7. Monitor app logs and `/api/health` after release.
