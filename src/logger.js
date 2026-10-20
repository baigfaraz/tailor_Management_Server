// Request and error log (SEC-007): one JSON line per event in
// <dir>/app-YYYY-MM-DD.log, files older than `retentionDays` are removed.
// Never log request bodies, PINs or cookies (they contain personal data/secrets).
const fs = require("node:fs");
const path = require("node:path");

const FILE_PATTERN = /^app-(\d{4}-\d{2}-\d{2})\.log$/;

function createLogger({
  dir,
  retentionDays = 14,
  now = () => new Date(),
  echo = true,
} = {}) {
  if (dir) fs.mkdirSync(dir, { recursive: true });

  const fileFor = (date) =>
    path.join(dir, `app-${date.toISOString().slice(0, 10)}.log`);

  const prune = () => {
    if (!dir) return;
    const cutoff = new Date(now().getTime() - retentionDays * 86_400_000)
      .toISOString()
      .slice(0, 10);
    for (const name of fs.readdirSync(dir)) {
      const match = FILE_PATTERN.exec(name);
      if (match && match[1] < cutoff) fs.rmSync(path.join(dir, name));
    }
  };

  const write = (level, event, fields = {}) => {
    const time = now();
    const line = JSON.stringify({
      time: time.toISOString(),
      level,
      event,
      ...fields,
    });
    if (dir) fs.appendFileSync(fileFor(time), `${line}\n`);
    // Errors also go to the console so they are visible while developing.
    if (echo && level === "error") console.error(line);
  };

  prune();
  return {
    info: (event, fields) => write("info", event, fields),
    error: (event, fields) => write("error", event, fields),
    prune,
  };
}

const silentLogger = { info() {}, error() {}, prune() {} };

// Logs method, path (without query string), status and duration.
function requestLogger(logger) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      logger.info("request", {
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: res.statusCode,
        ms: Number((process.hrtime.bigint() - start) / 1_000_000n),
        ip: req.ip,
      });
    });
    next();
  };
}

module.exports = { createLogger, requestLogger, silentLogger };
