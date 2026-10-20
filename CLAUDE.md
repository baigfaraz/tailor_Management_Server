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
- `backend/server.js`: Express app, CORS, JSON body parsing, mounts `/api/customerDetail`
- `backend/config/db.js`: Mongoose connection (loads `dotenv`)
- `backend/models/customerDetailModel.js`: `CustomerDetail` schema
- `backend/controllers/customerDetailController.js`: 6 handlers
- `backend/routes/customerDetailRoute.js`: route table
- `docs/improvement/`: improvement-plan reports

## Conventions
- Branches: `main` = stable, `improvement` = integration, task branches `phase-N/...`, `fix/...`, `feat/...`
- Never commit `.env`; env var names live in `.env.example`
- Handlers wrapped in `asyncHandler`, JSDoc-style `@desc / @routes / @access` comments above each
- Fields use the `customer_` prefix; `customer_id` is a numeric business ID separate from `_id`

## Current improvement plan
- Phase 0: Setup & baseline  ← done (2026-10-20)
- Phase 1: Audit
- Phase 2: Stabilize
- Phase 3: UI foundation (design system)
- Phase 4: Performance
- Phase 5: Polish existing features
- Phase 6: New features
- Phase 7: QA & release

Baseline report: `docs/improvement/phase-0/baseline-report.md`. Known issues: `docs/improvement/phase-0/known-issues.md` (server K-1xx; frontend K-0xx in the frontend repo).

## Rules for changes
- Small, focused changes; one task per branch
- Keep the API contract the frontend uses unless both repos change together
- Never point local work at a production database
