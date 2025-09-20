// rateLimiter.js
const rateLimit = require("express-rate-limit");
const config = require("../config/appConfig");

function createGeneralLimiter() {
  return rateLimit({
    windowMs: config.rateLimitWindow * 60 * 1000,
    max: config.rateLimitMaxRequests,
    message: {
      success: false,
      message: "Too many requests",
      retryAfter: config.rateLimitWindow * 60,
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      message: "Too many authentication attempts",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

function createOtpLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: {
      success: false,
      message: "Too many OTP requests",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

module.exports = {
  createGeneralLimiter,
  createAuthLimiter,
  createOtpLimiter,
};
