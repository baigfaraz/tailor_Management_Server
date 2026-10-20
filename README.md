# Tailor Management System — Server

Express + MongoDB API for a tailor shop: customers, measurements, orders and payment status. It also serves the web app ([tailor_Management_REACT](https://github.com/baigfaraz/tailor_Management_REACT)) so tablets on the shop Wi-Fi open one address.

## Requirements

- Node 24 (`.nvmrc`; e.g. `fnm install 24 && fnm use`)
- A MongoDB database (MongoDB Atlas works, including the free tier)

## Configuration

Copy `.env.example` to `.env` and fill it in. The server refuses to start if a required value is missing.

| Variable                        | Required  | Purpose                                                                                                   |
| ------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                   | yes       | Database connection string. Never point development at the shop's real database.                          |
| `SHOP_PIN`                      | yes       | 4–8 digits each device enters once. Changing it signs out every device.                                   |
| `SESSION_SECRET`                | yes       | At least 32 random characters (`openssl rand -hex 32`).                                                   |
| `PORT`                          | no (5000) | HTTP port.                                                                                                |
| `WEB_DIST`                      | no        | Path to the built web app, e.g. `../frontend/build`. When set, the server also serves the UI.             |
| `CORS_ORIGINS`                  | no        | Extra origins allowed to call the API (comma-separated). Not needed when the UI is served by this server. |
| `BACKUP_DIR`, `BACKUP_KEEP`     | no        | Backup folder (default `backups`) and how many to keep (30).                                              |
| `LOG_DIR`, `LOG_RETENTION_DAYS` | no        | Log folder (default `logs`) and days to keep (14).                                                        |

`.env`, `backups/` and `logs/` are git-ignored. Backups and logs contain customer data; keep them private.

## Development

```bash
npm ci
npm run dev      # restarts on file changes, http://localhost:5000
```

Run the web app's dev server (`npm start` in the frontend repo) for the UI; it proxies `/api` to port 5000.

## Checks

```bash
npm run lint
npm run format:check
npm test         # API tests on an in-memory MongoDB (never touches .env's database)
```

CI (GitHub Actions) runs all three on every push and pull request.

## Running at the shop

One computer runs the server; tablets and phones on the same Wi-Fi use it.

1. Clone both repos next to each other: `backend/` (this repo) and `frontend/`.
2. Build the web app: `cd frontend && npm ci && npm run build`.
3. Set up the server: `cd ../backend && npm ci`, then create `.env` with `MONGODB_URI`, `SHOP_PIN`, `SESSION_SECRET` and `WEB_DIST=../frontend/build`.
4. In MongoDB Atlas → Network Access, allow the shop's internet IP address.
5. Start: `npm start`. Allow incoming connections on port 5000 if the computer's firewall asks.
6. Find the computer's Wi-Fi address (macOS: `ipconfig getifaddr en0`; Windows: `ipconfig`), e.g. `192.168.1.10`.
7. On each tablet open `http://192.168.1.10:5000`, enter the shop PIN once, and use "Add to Home Screen".

Keep the server running after a restart with your OS's start-up tools (macOS: a Login Item or `launchd` job running `npm start` in this folder; Windows: Task Scheduler "At log on").

Use a staff-only Wi-Fi network if you can. The PIN protects the data, but a separate network is a second layer.

## Backups

The free Atlas tier has no automatic backups, so back up yourself:

```bash
npm run backup   # writes backups/<date-time>/ and keeps the newest 30
```

Schedule it daily and point `BACKUP_DIR` at a second place (USB drive or a synced cloud folder). Example `crontab -e` entry (macOS/Linux, 9 pm daily):

```
0 21 * * * cd /path/to/backend && /path/to/npm run backup >> backups/backup.log 2>&1
```

Restore (shows what it would do; add `--yes` to replace the data):

```bash
npm run restore -- backups/2026-10-20T21-00-00-000Z
npm run restore -- backups/2026-10-20T21-00-00-000Z --yes
npm run restore -- <folder> --uri <other-database-uri> --yes   # restore elsewhere to check a backup
```

## API

All `/api/customerDetail` routes need an unlocked device (cookie from `POST /api/session`).

| Method | Path                                             | Purpose                                                         |
| ------ | ------------------------------------------------ | --------------------------------------------------------------- |
| GET    | `/api/session`                                   | `{ unlocked }`                                                  |
| POST   | `/api/session`                                   | `{ pin }` → unlocks this device (5 wrong PINs → 15 min lockout) |
| DELETE | `/api/session`                                   | Forget this device                                              |
| POST   | `/api/customerDetail`                            | Create a customer (measurements, price and suits are numbers)   |
| GET    | `/api/customerDetail/somedata`                   | List (number, name, contact, statuses)                          |
| GET    | `/api/customerDetail/:customer_id`               | One customer                                                    |
| PUT    | `/api/customerDetail/orderStatus/:customer_id`   | `{ customer_orderStatus: "Pending" \| "Complete" }`             |
| PUT    | `/api/customerDetail/paymentStatus/:customer_id` | `{ customer_paymentStatus: "Pending" \| "Complete" }`           |
| DELETE | `/api/customerDetail/delete/:customer_id`        | Delete a customer                                               |

Errors are JSON: `{ "error": "..." }`, plus `fields` for invalid input.

## Project docs

Improvement plan, audit and reports: frontend repo `docs/improvement/`; server notes: `docs/improvement/` here and `CLAUDE.md`.
