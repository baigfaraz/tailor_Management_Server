# Known Issues — Server (Phase 0)

Recorded, not fixed. Fixing starts in Phase 2. Frontend issues live in the frontend repo (`tailor_Management_REACT`, `docs/improvement/phase-0/known-issues.md`, IDs K-0xx).

The owner reported no previously known bugs (asked 2026-10-20).

Severity: **Critical** security leak, data loss, crash, key flow broken. **High** key flow partly broken, major perf problem, build failing. **Medium** visible bug or UX problem with a workaround, many warnings. **Low** cosmetic, minor warnings, cleanup.

| ID | Area | Description | Where | Severity | Found in step |
|----|------|-------------|-------|----------|---------------|
| K-101 | Build | Repo had no `package.json`, lock file, `.gitignore`, README or scripts. A fresh clone could not be installed or run. Phase 0 added a reconstructed `package.json` with versions from Aug 2023 (when the backend was written). These versions are a best guess, not the originals. | repo root | Critical | 1, 3 |
| K-102 | Security | No authentication or authorization on any endpoint, including `DELETE`. Code comments say `@access private`. `cors()` allows every origin. | `server.js`, `routes/customerDetailRoute.js` | High | 2 |
| K-103 | Security / Errors | No error-handling middleware. A `POST` with missing fields returns Express's default HTML page with a full stack trace and absolute file paths. | `controllers/customerDetailController.js:65`, `server.js` | Medium | 4 |
| K-104 | Errors | Non-numeric `customer_id` (for example `GET /api/customerDetail/abc`) returns 500 (Mongoose CastError) instead of 400. | all `/:customer_id` routes | Medium | 4 |
| K-105 | Validation | Status endpoints accept any string (`{"customer_orderStatus":"anything"}` is saved). | `updateOrderStatus`, `updatePaymentStatus` | Medium | 4 |
| K-106 | Validation | Field check uses truthiness, so numeric `0` is rejected. Omitting `customer_upperPocket` passes the check but fails the schema and returns 500, not 400. | `setCustomerDetails` | Medium | 4 |
| K-107 | Data integrity | New `customer_id` = current max + 1, read then insert. Two creates at the same time can pick the same ID and one fails with a duplicate-key 500. | `setCustomerDetails` | Medium | 2 |
| K-108 | Data model | Measurements and price stored as strings with unit suffixes ("31 Inches", "2500 Rs"). `customer_noOfSuits` is a String. Totals are computed on the client with `parseFloat`. | `models/customerDetailModel.js`, controller | Medium | 2 |
| K-109 | Security / Deps | `npm audit` with the reconstructed versions: 12 vulnerabilities (1 critical `mongoose` 7.4.5, 6 high incl. `express` 4.18.2, `body-parser`, `path-to-regexp`, `nodemon`). | `package-lock.json` | Medium | 7 |
| K-110 | Config | Default port 5000 conflicts with macOS AirPlay Receiver (macOS 12+). The frontend hardcodes 5000, so on a Mac the UI cannot reach the API until AirPlay Receiver is off. | `server.js:5` | Medium | 3 |
| K-111 | Feature gap | No endpoint to edit customer details or measurements. Only the two status fields can change. | routes | Low | 2 |
| K-112 | Performance | `GET /somedata` returns every customer with no pagination. Fine at current size. | `getSomeDetail` | Low | 6 |
| K-113 | Code quality | `asyncHandler` wraps handlers that also have their own `try/catch`. Deprecated Mongoose options `useNewUrlParser` / `useUnifiedTopology`. Process exits on first DB connect failure, with no retry. | controller, `config/db.js` | Low | 2 |
| K-114 | Structure | Source sits in a nested `backend/` folder inside the repo. No tests, no lint config, no CI. | repo | Low | 2 |
| K-115 | Tooling | No seed script. Phase 0 seeded fake data through the API. | repo | Low | 3 |

## Count by severity

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 1 |
| Medium | 8 |
| Low | 5 |
