# BT Panel

BT Panel is a Next.js 16 / React 19 control-panel interface backed by MySQL through Drizzle ORM. The first registered account becomes the owner. A new database starts empty: it does **not** create demo users, nodes, or game servers. Add a real node in **Settings → Nodes**, then create a Paper server from **Servers → Create server**.

> **Important:** this project tracks server and plugin records in BT Panel, but does not yet provision a Minecraft process, download plugin JARs, or connect to Pterodactyl/Wings. Power, console, telemetry, and backup actions are simulations. The plugin tab is a persistent desired-plugin list for Paper servers.

## Managed website

The app is configured for a managed Next.js container on port `3000`, with the managed MySQL service. Runtime database credentials are read only when the app starts; they are not needed during image compilation and must not be committed. `PUBLIC_BASE_URL` should be set to the canonical public HTTPS origin after the site is published; password-reset email links are sent only when this value is configured.

## Run locally

Requirements: Node.js 22, npm 10+, and MySQL 8+ or MariaDB 10.5+.

1. Create a local database and account (the example password is for local development only):

   ```bash
   sudo apt install mariadb-server
   sudo mariadb <<'SQL'
   CREATE DATABASE btpanel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'btpanel'@'127.0.0.1' IDENTIFIED BY 'localdev';
   GRANT ALL PRIVILEGES ON btpanel.* TO 'btpanel'@'127.0.0.1';
   FLUSH PRIVILEGES;
   SQL
   ```

2. Configure and install the app:

   ```bash
   cp .env.example .env
   # Edit DATABASE_URL if your MySQL/MariaDB credentials differ.
   npm ci
   ```

3. Start the local app:

   ```bash
   PORT=3001 npm run dev
   ```

4. Open <http://localhost:3001/register>. The first account becomes the owner. Add a node under **Settings → Nodes**, then create a Paper server under **Servers**.

Useful checks:

```bash
npm run lint

npm run build
PORT=3001 npm start
```

## Optional Debian 12/13 self-hosting

For a separate VPS, `deploy/setup-debian.sh` installs Node.js 22, MariaDB, Nginx, and Certbot, then runs the app behind Nginx. Point a DNS A/AAAA record at the VPS first if you want HTTPS on the first pass:

```bash
git clone https://github.com/lie-kg1/BT-Panel.git /opt/src
cd /opt/src
sudo bash deploy/setup-debian.sh panel.example.com
```

The app listens on `127.0.0.1:3001`; do not expose that port publicly. The installer writes `/opt/bt-panel/.env` with mode `0600` and enables Secure cookies after it successfully obtains an HTTPS certificate. For an IP/HTTP installation, configure TLS before sending real credentials.

The installer excludes `.git` from the application directory. Update the source checkout and rerun the installer:

```bash
cd /opt/src
sudo git pull --ff-only
sudo bash deploy/setup-debian.sh panel.example.com
```

Common VPS operations:

```bash
sudo systemctl status bt-panel
sudo journalctl -u bt-panel -f
sudo systemctl restart bt-panel
sudo nano /opt/bt-panel/.env
sudo mariadb-dump btpanel > /root/bt-panel-$(date +%F).sql
```

Allow SSH and Nginx (80/443) through the firewall; keep MariaDB and port 3001 private.

## Configuration and account security

Important environment variables are `DATABASE_URL`, `PORT`, `COOKIE_SECURE`, and `PUBLIC_BASE_URL`. Set `PUBLIC_BASE_URL` to the canonical site URL (for example `https://panel.example.com`) so OAuth redirects and password-reset links never depend on an untrusted request Host header. Use unique production credentials and do not commit `.env` files. SMTP and Google OAuth settings can also be configured by an administrator; secret values are not returned to browser clients.

Mutating API requests require the `x-btp-csrf: 1` header; the browser helper adds it automatically.

## Database schema and upgrades

The declarative MySQL model is in `src/db/schema.ts`. `ensureDatabase()` in `src/lib/server/data.ts` creates the idempotent schema and applies versioned runtime migrations recorded in `schema_migrations`; the health endpoint waits for that bootstrap before returning healthy. The initial schema includes users, settings, nodes, servers, events, backups, plugin inventory, and related panel data, but contains no seeded sample fleet.

Keep the Drizzle schema and runtime migration DDL aligned when adding columns or tables. Use additive, versioned migrations for existing installations; back up production before schema changes. The Drizzle Kit commands in `package.json` are available for controlled development work, but a generated create-table baseline must not be blindly applied to a database already initialized by the runtime bootstrap. This MySQL release does not automatically migrate data from a previous PostgreSQL deployment; move data through a deliberate backup/transform/import process if upgrading one.

## Server ownership API

Administrators can reassign a server to an active user or leave it unassigned:

```http
PATCH /api/servers/{id}/owner
Content-Type: application/json
x-btp-csrf: 1
Cookie: btp_session=…

{"ownerId":"usr_abc123"}
```

Use `{"ownerId":null}` (or an empty string) to unassign it. The route checks administrator permissions, rejects suspended users, and records the ownership change with a system event in a transaction. The **Users** page includes the same Server ownership control.

## Paper servers and plugins

Open **Servers** or go to `/servers`, choose **Create server**, and select the node and CPU/memory/disk allocations. **Manage** opens the detail view. For a Paper server, **Plugins** lets an authorized user add and remove entries from the per-server catalog-backed list. These are database records only: plugin JAR installation and live game-server control require a separately configured Pterodactyl/Wings integration.
