import rateLimit from 'express-rate-limit';

/**
 * Per-IP limits are off in the test suite and when RATE_LIMITS_DISABLED=true
 * (local E2E runs log in many times from one machine). src/config.ts refuses
 * RATE_LIMITS_DISABLED in UAT and production.
 */
export const rateLimitsOff = () => process.env.NODE_ENV === 'test' || process.env.RATE_LIMITS_DISABLED === 'true';

/**
 * Rate limiter for raffle ticket creation.
 * Allows 5 requests per minute per IP address.
 */
export const raffleRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 raffle purchase requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many raffle purchase attempts. Please try again after a minute.'
    }
  },
  skipSuccessfulRequests: false,
  skip: rateLimitsOff,
});

/**
 * General rate limiter for sensitive endpoints.
 */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please try again later.'
    }
  },
  skip: rateLimitsOff,
});
