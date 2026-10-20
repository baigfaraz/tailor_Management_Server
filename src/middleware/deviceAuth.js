// Shop PIN per device (SEC-001). A device that sends the correct PIN once gets a
// signed, httpOnly cookie; every protected route requires it. The signing key
// includes the PIN, so changing SHOP_PIN signs out every device.
const crypto = require("node:crypto");
const express = require("express");

const COOKIE = "tailor_device";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function createDeviceAuth({ shopPin, sessionSecret, now = () => Date.now() }) {
  const key = crypto
    .createHmac("sha256", sessionSecret)
    .update(`pin:${shopPin}`)
    .digest();

  const sign = (issuedAt) =>
    crypto.createHmac("sha256", key).update(`device:${issuedAt}`).digest("hex");

  const issueToken = () => {
    const issuedAt = now();
    return `${issuedAt}.${sign(issuedAt)}`;
  };

  const isValidToken = (token) => {
    if (!token) return false;
    const [issuedAt, signature] = token.split(".");
    if (!issuedAt || !signature) return false;
    if (now() - Number(issuedAt) > ONE_YEAR_MS) return false;
    return safeEqual(signature, sign(issuedAt));
  };

  const isUnlocked = (req) => isValidToken(readCookie(req, COOKIE));

  const failures = new Map(); // ip -> { count, until }
  const isLockedOut = (ip) => {
    const entry = failures.get(ip);
    if (!entry) return false;
    if (entry.until && entry.until > now()) return true;
    if (entry.until && entry.until <= now()) failures.delete(ip);
    return false;
  };
  const recordFailure = (ip) => {
    const entry = failures.get(ip) || { count: 0, until: 0 };
    entry.count += 1;
    if (entry.count >= MAX_FAILED_ATTEMPTS) {
      entry.until = now() + LOCKOUT_MS;
      entry.count = 0;
    }
    failures.set(ip, entry);
  };

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    maxAge: ONE_YEAR_MS,
    path: "/",
  };

  const router = express.Router();

  router.get("/", (req, res) => {
    res.json({ unlocked: isUnlocked(req) });
  });

  router.post("/", (req, res) => {
    const ip = req.ip;
    if (isLockedOut(ip)) {
      return res
        .status(429)
        .json({ error: "Too many wrong PINs. Try again in 15 minutes." });
    }
    const pin = req.body && req.body.pin;
    if (typeof pin !== "string" || !safeEqual(pin, shopPin)) {
      recordFailure(ip);
      return res.status(401).json({ error: "Wrong PIN." });
    }
    failures.delete(ip);
    res.cookie(COOKIE, issueToken(), cookieOptions);
    res.json({ unlocked: true });
  });

  router.delete("/", (req, res) => {
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ unlocked: false });
  });

  const requireDevice = (req, res, next) => {
    if (isUnlocked(req)) return next();
    res.status(401).json({ error: "This device is not unlocked." });
  };

  return { router, requireDevice };
}

module.exports = { createDeviceAuth, COOKIE };
