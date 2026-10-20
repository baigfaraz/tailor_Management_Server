# Project: Tailor Management System — Server

## What this app does
REST API for a tailor shop app. It stores customers with measurements, order details, price, order status and payment status in MongoDB. The React UI is the separate repo `tailor_Management_REACT`, usually cloned next to this one as `../frontend`.

## Stack
- Node 20 (`.nvmrc`), JavaScript (CommonJS)
- npm only (`package-lock.json`)
- Express 4, Mongoose 7, `cors`, `dotenv`, `express-async-handler`; `nodemon` for dev
- MongoDB 7 (local dev: Docker `mongo:7`)
- Dependency versions were reconstructed in Phase 0 because the repo had no `package.json` (K-101)

## Commands
- Install: `npm ci`
- Start: `npm start` (http://localhost:5000)
- Dev (auto-restart): `npm run dev`
- Local DB: `docker run -d --name tailor-mongo -p 27017:27017 mongo:7`
- No lint, tests or build yet

Copy `.env.example` to `.env` and set `MONGODB_URI`. Run from the repo root (`dotenv` reads `.env` from the current directory). On macOS, turn off AirPlay Receiver to free port 5000; the frontend hardcodes it.

## Structure
- `src/server.js`: Express app, CORS, JSON body parsing, mounts `/api/customerDetail`
- `src/config/db.js`: Mongoose connection (loads `dotenv`)
- `src/models/customerDetailModel.js`: `CustomerDetail` schema
- `src/controllers/customerDetailController.js`: 6 handlers
- `src/routes/customerDetailRoute.js`: route table
- `docs/improvement/`: improvement-plan reports

## Conventions
- Branches: `main` = stable, `improvement` = integration, task branches `phase-N/...`, `fix/...`, `feat/...`
- Never commit `.env`; env var names live in `.env.example`
- Handlers wrapped in `asyncHandler`, JSDoc-style `@desc / @routes / @access` comments above each
- Fields use the `customer_` prefix; `customer_id` is a numeric business ID separate from `_id`

## Current improvement plan
- Phase 0: Setup & baseline ✅ (2026-10-20)
- Phase 1: Audit ✅ (2026-10-20)
- Phase 2: Stabilize  ← next (starts with safety-net tests)
- Phase 3: UI foundation (design system)
- Phase 4: Performance
- Phase 5: Polish existing features
- Phase 6: New features
- Phase 7: QA & release

Baseline report: `docs/improvement/phase-0/baseline-report.md`. Known issues: `docs/improvement/phase-0/known-issues.md` (server K-1xx; frontend K-0xx in the frontend repo).

Phase 1 audit, backlog and roadmap for both repos live in the frontend repo: `docs/improvement/phase-1/` (pointer in this repo's `docs/improvement/phase-1/README.md`).

## Owner decisions (Phase 1)
- Runs on the shop PC; tablets connect over the shop Wi-Fi. No login; API protected by a shop PIN per device (SEC-001)
- Data model may change freely (no real data yet): numeric fields, Customer/Order split, measurement history, due date, advance + balance

## Handle with care
- `src/controllers/customerDetailController.js` (all logic, ID race, weak validation)
- `src/models/customerDetailModel.js` (schema changes ripple to every screen)
- `src/server.js` (CORS `*`, port, no error middleware, LAN exposure)

## Rules for changes
- Small, focused changes; one task per branch
- Keep the API contract the frontend uses unless both repos change together
- Never point local work at a production database
