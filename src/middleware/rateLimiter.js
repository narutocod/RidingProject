const rateLimit = require("express-rate-limit");
const { getRedisClient } = require("../config/redis");
const config = require("../config/appConfig");

/**
 * Redis store for rate limiting
 */
class RedisStore {
  constructor(options = {}) {
    this.client = getRedisClient();
    if (!this.client) {
      throw new Error("Redis client not initialized. Call connectRedis() first.");
    }
    this.prefix = options.prefix || "rl:";
    this.expiry = options.expiry || 900; // 15 minutes default
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
    const redisKey = this.prefix + key;
    return await this.client.decr(redisKey);
  }

  async resetKey(key) {
    const redisKey = this.prefix + key;
    await this.client.del(redisKey);
  }
}

/**
 * Factory functions — create limiter *after* Redis is ready
 */
function createGeneralLimiter() {
  return rateLimit({
    windowMs: config.rateLimitWindow * 60 * 1000,
    max: config.rateLimitMaxRequests,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later",
      retryAfter: config.rateLimitWindow * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore(),
  });
}

function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      message: "Too many authentication attempts, please try again later",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix: "auth_rl:" }),
  });
}

function createOtpLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: {
      success: false,
      message: "Too many OTP requests, please wait a minute before trying again",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix: "otp_rl:" }),
  });
}

module.exports = {
  createGeneralLimiter,
  createAuthLimiter,
  createOtpLimiter,
};
