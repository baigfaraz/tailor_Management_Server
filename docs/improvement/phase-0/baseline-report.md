# Phase 0 Baseline Report — Server
Date: 2026-10-20   Commit: 0a06a94   Tag: v0-baseline

System = this repo (`tailor_Management_Server`) + frontend repo (`tailor_Management_REACT`). UI measurements (Lighthouse, bundle, screenshots, pages and flows) are in the frontend repo at `docs/improvement/phase-0/`.

## 1. Summary

- **Overall health:** A small Express + Mongoose REST API: 5 files, about 310 lines, 6 endpoints on one `CustomerDetail` collection. The repo could not run from a clone because it had no `package.json` (K-101). With a reconstructed manifest it starts on Node 20, connects to MongoDB 7, and every endpoint works on the happy path in under 25 ms. Error handling and validation are weak, and there is no authentication.
- **Top 5 problems:** K-101 (no manifest), K-102 (no auth, open CORS), K-103 (stack traces in error responses), K-107 (race in ID generation), K-109 (vulnerable dependency versions).
- **Blocked measurement:** macOS AirPlay Receiver holds port 5000 and the owner chose to keep it on. The server was measured on port 5001 (`PORT=5001`).

## 2. Repository

| Item | Value |
|---|---|
| Remote | `git@github.com:baigfaraz/tailor_Management_Server.git` |
| Default branch | `main` |
| Working branches | `improvement` (integration), `phase-0/baseline` (this work) |
| Baseline tag | `v0-baseline` on `0a06a94`, pushed to origin |
| Uncommitted work at start | None |
| Tracked secrets | None found. `.env` was never committed. |
| `.gitignore` | Missing. Added in Phase 0 (`node_modules/`, `.env*`, logs, coverage, OS/editor files). |
| Recommendation | Turn on branch protection for `main` on GitHub. |

## 3. Stack

| Item | Status | Detail |
|---|---|---|
| Language / runtime | found | JavaScript, CommonJS. Node not declared; pinned to `20` in `.nvmrc` and `engines` in Phase 0. |
| Package manager | added | npm. No manifest or lock file existed; `package.json` + `package-lock.json` created in Phase 0. |
| Framework | found | Express (reconstructed as 4.18.2) |
| Database / ORM | found | MongoDB via Mongoose (reconstructed as 7.4.5). One model: `CustomerDetail`. |
| Other libraries | found | `cors`, `dotenv`, `express-async-handler` |
| Auth | not found | None |
| Testing | not found | None |
| Lint / format | not found | None |
| Deployment | not found | Not deployed (owner confirmed). No Dockerfile, no CI. |
| Size | — | 5 tracked files, about 313 lines. |

Reconstructed dependency versions (released by Aug 2023, when the backend was written): `express` 4.18.2, `mongoose` 7.4.5, `cors` 2.8.5, `dotenv` 16.3.1, `express-async-handler` 1.2.0, dev `nodemon` 3.0.1. If the original machine still has a `package.json`, compare and replace.

## 4. How to Run Locally

```bash
fnm install 20 && fnm use 20                          # reads .nvmrc
docker run -d --name tailor-mongo -p 27017:27017 mongo:7
cp .env.example .env                                  # set MONGODB_URI=mongodb://localhost:27017/tailor
npm ci
npm start                                             # or: npm run dev (nodemon)
```

Expected log: `Server started at Port 5000.` then `MongoDB connected you are good to GO!`

Environment variables (`.env.example`):

| Name | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string. Use a local or dev database, never production. |
| `PORT` | no (default 5000) | HTTP port. The frontend expects 5000. |

`dotenv` reads `.env` from the current directory, so run commands from the repo root.

macOS: if `EADDRINUSE :::5000` appears, turn off System Settings > General > AirDrop & Handoff > AirPlay Receiver.

## 5. Health Checks

| Check | Result | Detail |
|---|---|---|
| Install (`npm install`, new lock file) | ⚠️ pass | 126 packages in 27 s. 12 vulnerabilities. `raw/install.log` |
| Server starts | ✅ pass | Starts and connects to MongoDB 7 in about 1 s (on port 5001). `raw/server.log` |
| Build | ➖ | No build step. |
| Lint / type check | ➖ | Not configured. |
| Tests / coverage | ➖ | None. |

API smoke test (port 5001, local MongoDB, 5 fake customers):

| Request | Status | Notes |
|---|---|---|
| `POST /api/customerDetail` (all fields) | 201 | about 6–21 ms |
| `POST /api/customerDetail` `{}` | 400 | HTML stack trace body (K-103) |
| `POST` without `customer_upperPocket` | 500 | should be 400 (K-106) |
| `GET /api/customerDetail/somedata` | 200 | all rows, no pagination |
| `GET /api/customerDetail/1` | 200 | |
| `GET /api/customerDetail/abc` | 500 | should be 400 (K-104) |
| `PUT /orderStatus/999` | 404 | correct |
| `PUT /orderStatus/2` `"anything"` | 200 | value accepted (K-105) |
| `DELETE /delete/:id` | 200 | no auth (K-102) |

## 6. Endpoints

| Method | Path | Handler |
|---|---|---|
| POST | `/api/customerDetail` | `setCustomerDetails` |
| GET | `/api/customerDetail/somedata` | `getSomeDetail` |
| GET | `/api/customerDetail/:customer_id` | `getDetailById` |
| PUT | `/api/customerDetail/orderStatus/:customer_id` | `updateOrderStatus` |
| PUT | `/api/customerDetail/paymentStatus/:customer_id` | `updatePaymentStatus` |
| DELETE | `/api/customerDetail/delete/:customer_id` | `deleteCustomer` |

UI pages and key flows: frontend repo, `docs/improvement/phase-0/pages-and-flows.md`.

## 7. Performance Baseline

All endpoints answered in under 25 ms locally with 5 rows. No load test was run. Note K-112 (no pagination) before data grows.

## 8. Dependencies & Security

`raw/outdated.txt`, `raw/audit.txt`, `raw/audit.json`. These numbers describe the reconstructed versions, not proven originals.

| Package | Current | Latest | Behind |
|---|---|---|---|
| express | 4.18.2 | 5.3.0 | major |
| mongoose | 7.4.5 | 9.11.2 | major |
| dotenv | 16.3.1 | 18.0.8 | major |
| cors | 2.8.5 | 2.8.6 | patch |
| nodemon (dev) | 3.0.1 | 3.1.14 | minor |

Vulnerabilities: **12** (1 critical, 6 high, 2 moderate, 3 low). Critical: `mongoose` (direct). High: `express` (direct), `nodemon` (direct, dev), `body-parser`, `braces`, `chokidar`, `path-to-regexp`.

Nothing was upgraded.

## 9. Visual Baseline

Not applicable. See the frontend repo `docs/improvement/phase-0/screenshots/`.

## 10. Known Issues

15 server issues: 1 Critical, 1 High, 8 Medium, 5 Low. See [known-issues.md](known-issues.md).

## 11. Recommendations for Phase 1

1. Confirm or replace the reconstructed dependency versions (K-101).
2. Authentication and authorization design, together with the frontend's missing Google login (K-102).
3. Error handling and input validation across all endpoints (K-103 to K-106).
4. Data model: numeric measurements and price, safe ID generation (K-107, K-108).
5. Configurable port and CORS origin, aligned with the frontend's API URL (K-110).
6. Test plan for the 6 endpoints before any Phase 2 change.
