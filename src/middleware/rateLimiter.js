const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

/**
 * Redis store for rate limiting
 */
class RedisStore {
  constructor(options = {}) {
    this.client = getRedisClient();
    this.prefix = options.prefix || 'rl:';
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
      timeToExpire: await this.client.ttl(redisKey) * 1000
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
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: process.env.rateLimitWindow * 60 * 1000, // 15 minutes
  max: process.env.rateLimitMaxRequests, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: process.env.rateLimitWindow * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore()
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'auth_rl:' })
});

/**
 * OTP rate limiter
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: {
    success: false,
    message: 'Too many OTP requests, please wait a minute before trying again',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'otp_rl:' })
});

module.exports = {
  generalLimiter,
  authLimiter,
  otpLimiter
};
