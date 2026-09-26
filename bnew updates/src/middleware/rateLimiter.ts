import rateLimit from "express-rate-limit";

// Global limiter for all API requests.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: [{ message: "Too many requests. Please try again later." }] },
});

// Stricter limiter for auth mutations to slow down brute-force attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: [{ message: "Too many login attempts. Please try again later." }] },
});
