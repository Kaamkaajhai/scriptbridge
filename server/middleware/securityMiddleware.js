import helmet from "helmet";
import hpp from "hpp";
import { rateLimit } from "express-rate-limit";

const oneMinute = 60 * 1000;

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

export const apiLimiter = buildLimiter({
  windowMs: oneMinute,
  max: Number(process.env.API_RATE_LIMIT_MAX || 240),
  message: "Too many requests. Please try again shortly.",
});

export const authLimiter = buildLimiter({
  windowMs: oneMinute,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 40),
  message: "Too many auth attempts. Please wait a moment.",
});

export const paymentLimiter = buildLimiter({
  windowMs: oneMinute,
  max: Number(process.env.PAYMENT_RATE_LIMIT_MAX || 30),
  message: "Too many payment requests. Please wait and retry.",
});

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    value.forEach((item) => sanitizeObject(item));
    return;
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      const nextKey = key.replace(/^\$+/, "").replace(/\./g, "");
      const nested = value[key];

      if (nextKey !== key) {
        delete value[key];
        value[nextKey] = nested;
      }

      sanitizeObject(value[nextKey]);
    }
  }
};

const requestSanitizer = (req, _res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
};

export const applyGlobalSecurity = (app) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(requestSanitizer);
  app.use(hpp());
};
