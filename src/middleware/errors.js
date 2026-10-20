// JSON errors for the API (SEC-002, SEC-003). Handlers throw or forward errors;
// clients get { error } (plus { fields } for invalid input) without stack traces
// or file paths. Unexpected errors are logged and answered with a generic 500.
const mongoose = require("mongoose");
const { FIELD_LABELS } = require("../models/customerDetailModel");

const GENERIC_MESSAGE = "An error occurred while processing your request.";

function apiNotFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

// Fields in the order the form shows them.
const FIELD_ORDER = Object.keys(FIELD_LABELS);
const formOrder = (path) =>
  FIELD_ORDER.includes(path) ? FIELD_ORDER.indexOf(path) : FIELD_ORDER.length;

function validationResponse(err) {
  const fields = {};
  const entries = Object.entries(err.errors).sort(
    ([a], [b]) => formOrder(a) - formOrder(b),
  );
  for (const [path, detail] of entries) {
    const label = FIELD_LABELS[path] || path;
    fields[path] =
      detail.name === "CastError"
        ? `${label} must be a number`
        : detail.message;
  }
  const labels = Object.keys(fields).map((path) => FIELD_LABELS[path] || path);
  return { error: `Please check: ${labels.join(", ")}.`, fields };
}

// Express recognises error handlers by their four arguments.
const createErrorHandler = (logger) => (err, req, res, _next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json(validationResponse(err));
  }
  const status =
    res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
  if (status === 500) {
    logger.error("unhandled_error", {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: GENERIC_MESSAGE });
  }
  res.status(status).json({ error: err.message });
};

module.exports = { apiNotFound, createErrorHandler, GENERIC_MESSAGE };
