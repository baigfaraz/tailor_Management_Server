const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const { createDeviceAuth } = require("./middleware/deviceAuth");
const { apiNotFound, createErrorHandler } = require("./middleware/errors");
const { requestLogger, silentLogger } = require("./logger");
const { securityHeaders } = require("./middleware/securityHeaders");

// Options:
// - shopPin, sessionSecret: required; protect the API with a per-device PIN (SEC-001).
// - corsOrigins: extra origins allowed to call the API (default none; the web
//   app is served from the same origin).
// - logger: request/error log (SEC-007); silent by default (tests).
// - webDist: path to the built frontend (e.g. ../frontend/build). When set, the
//   app also serves the web UI; unknown non-API paths get index.html so
//   client-side routes work on reload.
function createApp({
  shopPin,
  sessionSecret,
  corsOrigins = [],
  webDist,
  logger = silentLogger,
} = {}) {
  if (!shopPin || !sessionSecret) {
    throw new Error("createApp needs shopPin and sessionSecret");
  }
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);
  // gzip/brotli for JSON and the web app's JS/CSS (several hundred KB raw).
  app.use(compression());
  app.use(requestLogger(logger));
  const deviceAuth = createDeviceAuth({ shopPin, sessionSecret });

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/api/session", deviceAuth.router);
  app.use(
    "/api/customerDetail",
    deviceAuth.requireDevice,
    require("./routes/customerDetailRoute"),
  );
  app.use("/api", apiNotFound);

  const dist = webDist && path.resolve(webDist);
  if (dist && fs.existsSync(path.join(dist, "index.html"))) {
    app.use(express.static(dist));
    app.get(/^\/(?!api\/).*/, (req, res) => {
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  app.use(createErrorHandler(logger));

  return app;
}

module.exports = { createApp };
