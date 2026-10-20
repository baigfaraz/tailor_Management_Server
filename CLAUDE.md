# Project: Tailor Management System — Server

## What this app does

REST API for a tailor shop app. It stores customers with measurements, order details, price, order status and payment status in MongoDB, and serves the built web app (`WEB_DIST`) so tablets on the shop Wi-Fi use one address. The React UI is the separate repo `tailor_Management_REACT`, usually cloned next to this one as `../frontend`.

## Stack

- Node 24 LTS (`.nvmrc`), JavaScript (CommonJS)
- npm only (`package-lock.json`); npm 11 install scripts controlled by `allowScripts`
- Express 5, Mongoose 9, `cors` (allowlist), `compression`, `dotenv` 18, `express-async-handler`; `node --watch` for dev
- MongoDB Atlas (free tier) in `.env`; tests use `mongodb-memory-server`
- Dependency versions were reconstructed in Phase 0 (no original `package.json`, K-101) and upgraded in Phase 2

## Commands

- Install: `npm ci`
- Start: `npm start` (http://localhost:5000); dev: `npm run dev`
- Lint / format: `npm run lint`, `npm run format:check`
- Tests: `npm test` (in-memory MongoDB; never uses `.env`)
- E2E server for the web repo: `npm run start:e2e` (in-memory DB, PIN 2468, ports 5100/5155)
- Backup / restore: `npm run backup`, `npm run restore -- <folder> [--uri <target>] --yes`
- Numeric migration for old text records: `npm run migrate:numeric [-- --yes]`
- Judge checks by exit code

`.env` (from `.env.example`): `MONGODB_URI`, `SHOP_PIN`, `SESSION_SECRET` required; start-up fails with a clear list otherwise. Only `src/server.js` and the backup/migration scripts load `.env`.

## Structure

- `src/server.js`: loads `.env`, validates it (`config/env.js`), connects, creates the logger, starts `createApp`
- `src/app.js`: `createApp({ shopPin, sessionSecret, corsOrigins, webDist, logger })`
- `src/middleware/`: `deviceAuth` (PIN cookie, lockout), `errors` (JSON errors, validation → 400 with fields), `securityHeaders`
- `src/models/`: `CustomerDetail` (numeric measurements/price/suits, enums), `Counter` (atomic customer numbers)
- `src/controllers/customerDetailController.js`: 6 handlers; `src/routes/`: route table
- `src/backup/`, `src/migrations/`, `src/logger.js`; `scripts/`: backup, restore, migrate, e2e server
- `test/`: Vitest suites; `docs/improvement/`: improvement-plan reports

## Conventions

- Branches: `main` = stable, `improvement` = integration, task branches `phase-N/<backlog-id>-<name>`; direct merges (solo)
- Commits: `fix(<area>): ... [<backlog-id>]`, `chore(deps):`, `test:`, `docs:`; end with the Co-Authored-By line
- Bug fixes: failing test first
- Never commit `.env`, `backups/` or `logs/` (customer data); never log bodies, PINs or cookies
- Handlers wrapped in `asyncHandler` with `@desc / @routes / @access` comments; errors are thrown with `res.status(4xx)` set
- Fields use the `customer_` prefix; `customer_id` is a numeric business ID from the counter, separate from `_id`

## Current improvement plan

- Phase 0: Setup & baseline ✅ (2026-10-20)
- Phase 1: Audit ✅ (2026-10-20)
- Phase 2: Stabilize ✅ (2026-10-20, tag `v1-stabilized`)
- Phase 3: UI foundation (design system) ← next (web repo)
- Phase 4: Performance (cache headers PERF-008 here)
- Phase 5: Polish existing features
- Phase 6: New features (Customer/Order split, search endpoint, edit endpoint)
- Phase 7: QA & release

Reports and the system-wide backlog live in the frontend repo `docs/improvement/` (pointers in this repo's `docs/improvement/phase-1/README.md` and `phase-2/README.md`). README.md covers setup, running at the shop, backups and the API.

## Owner decisions

- Runs on the shop PC; tablets connect over the shop Wi-Fi. No login; shop PIN per device
- Data model may change freely: numeric fields done (Phase 2); Customer/Order split, measurement history, due date, advance + balance in Phase 6

## Handle with care

- `src/controllers/customerDetailController.js` (all customer logic)
- `src/models/customerDetailModel.js` (schema changes ripple to every screen; run a migration for existing data)
- `src/middleware/deviceAuth.js` (access control)
- `src/app.js` (middleware order: headers → compression → logging → CORS → parsers → routes → errors)

## Rules for changes

- Small, focused changes; one task per branch
- Keep the API contract the frontend uses unless both repos change together; run the web repo's E2E against server changes
- Never point local work or tests at the production database; back up before any data change
