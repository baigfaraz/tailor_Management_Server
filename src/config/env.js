// Validates required environment variables at start-up and fails fast with a
// clear message instead of confusing runtime errors.
function readEnv(env = process.env) {
  const errors = [];
  const shopPin = env.SHOP_PIN;
  const sessionSecret = env.SESSION_SECRET;

  if (!env.MONGODB_URI) errors.push("MONGODB_URI is missing");
  if (!shopPin || !/^\d{4,8}$/.test(shopPin)) {
    errors.push("SHOP_PIN must be 4 to 8 digits");
  }
  if (!sessionSecret || sessionSecret.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters");
  }
  if (errors.length) {
    throw new Error(`Invalid environment:\n- ${errors.join("\n- ")}`);
  }

  return {
    port: Number(env.PORT || 5000),
    shopPin,
    sessionSecret,
    corsOrigins: (env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    webDist: env.WEB_DIST,
    logDir: env.LOG_DIR || "logs",
    logRetentionDays: Number(env.LOG_RETENTION_DAYS || 14),
  };
}

module.exports = { readEnv };
