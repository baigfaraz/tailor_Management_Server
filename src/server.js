require("dotenv").config({ quiet: true });
const { readEnv } = require("./config/env");
const connectDB = require("./config/db");
const { createApp } = require("./app");
const { createLogger } = require("./logger");

let config;
try {
  config = readEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

connectDB();

const logger = createLogger({
  dir: config.logDir,
  retentionDays: config.logRetentionDays,
});
// Remove old log files once a day while the server runs.
setInterval(logger.prune, 24 * 60 * 60 * 1000).unref();

const app = createApp({ ...config, logger });

app.listen(config.port, () =>
  console.log(`Server started at Port ${config.port}.`),
);

module.exports = app;
