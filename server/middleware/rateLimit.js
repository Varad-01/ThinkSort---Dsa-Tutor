const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
  keyGenerator: (req) => req.user?.userId || req.ip, // Rate limit by userId if authenticated, else IP
  message: "Too many requests, please try again later.",
});

module.exports = limiter;
