import rateLimit from 'express-rate-limit';

// General API Rate Limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Checkout and Payment rate limiter - more restrictive
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 checkout/verification requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests, please try again after 15 minutes' }
});

// Auth / Profile Sync rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth synchronization requests, please try again after 15 minutes' }
});
