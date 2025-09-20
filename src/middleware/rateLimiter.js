// rateLimiter.js
const rateLimit = require("express-rate-limit");
const { getRedisClient } = require("../config/redis");
const config = require("../config/appConfig");

class RedisStore {
  constructor(options = {}) {
    const client = getRedisClient(); // runs only when limiter is created
    this.client = client;
    this.prefix = options.prefix || "rl:";
    this.expiry = options.expiry || 900;
  }

  async incr(key) {
    const redisKey = this.prefix + key;
    const current = await this.client.incr(redisKey);
    if (current === 1) {
      await this.client.expire(redisKey, this.expiry);
    }
    return {
      totalHits: current,
      timeToExpire: (await this.client.ttl(redisKey)) * 1000,
    };
  }

  async decrement(key) {
    return await this.client.decr(this.prefix + key);
  }

  async resetKey(key) {
    await this.client.del(this.prefix + key);
  }
}

// 🔑 Helper: pick correct store (Redis in prod, memory in dev/test)
function getStore(options) {
  if (process.env.NODE_ENV === "production") {
    return new RedisStore(options);
  }
  return undefined; // default memory store
}

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
    legacyHeaders: false,
    store: getStore(),
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
    legacyHeaders: false,
    store: getStore({ prefix: "auth_rl:" }),
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
    legacyHeaders: false,
    store: getStore({ prefix: "otp_rl:" }),
  });
}

module.exports = {
  createGeneralLimiter,
  createAuthLimiter,
  createOtpLimiter,
};
