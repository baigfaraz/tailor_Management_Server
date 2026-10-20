// JSON errors for the API (SEC-002). Handlers throw or forward errors; clients get
// { error } without stack traces or file paths. Unexpected errors are logged and
// answered with a generic 500.
const GENERIC_MESSAGE = "An error occurred while processing your request.";

function apiNotFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

// Express recognises error handlers by their four arguments.
function errorHandler(err, req, res, _next) {
  const status =
    res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
  if (status === 500) {
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    return res.status(500).json({ error: GENERIC_MESSAGE });
  }
  res.status(status).json({ error: err.message });
}

module.exports = { apiNotFound, errorHandler, GENERIC_MESSAGE };
