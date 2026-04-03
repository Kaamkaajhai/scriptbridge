import crypto from "crypto";

const OTP_EXPIRY_SECONDS = 5 * 60;

const parsePositiveInt = (value, fallbackValue) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
};

const resolveOTPExpirySeconds = () => OTP_EXPIRY_SECONDS;

const resolveOTPResendCooldownSeconds = () =>
  parsePositiveInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 2);

export const getOTPExpirySeconds = () => resolveOTPExpirySeconds();

export const getOTPResendCooldownSeconds = () => resolveOTPResendCooldownSeconds();

// Generate a 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const getOTPHmacSecret = () =>
  String(process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "");

export const hashOTP = (otp) => {
  const normalizedOtp = String(otp || "").trim();
  const secret = getOTPHmacSecret();
  if (!secret) {
    throw new Error("OTP hash secret is not configured");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(normalizedOtp)
    .digest("hex");
};

export const isHashedOTP = (value) =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

export const verifyHashedOTP = (storedHash, otp) => {
  if (!isHashedOTP(storedHash)) return false;

  const computedHash = hashOTP(otp);
  const storedBuffer = Buffer.from(storedHash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (storedBuffer.length !== computedBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, computedBuffer);
};

// Generate OTP expiry time based on configured validity window.
export const generateOTPExpiry = () => {
  return new Date(Date.now() + getOTPExpirySeconds() * 1000);
};

export const generateOTPResendAvailableAt = () => {
  return new Date(Date.now() + getOTPResendCooldownSeconds() * 1000);
};

export const getRemainingResendCooldownSeconds = (resendAvailableAt) => {
  if (!resendAvailableAt) return 0;

  const availableAtMs = new Date(resendAvailableAt).getTime();
  if (!Number.isFinite(availableAtMs)) return 0;

  return Math.max(0, Math.ceil((availableAtMs - Date.now()) / 1000));
};

// Check if OTP is expired
export const isOTPExpired = (expiryDate) => {
  if (!expiryDate) return true;

  const expiryMs = new Date(expiryDate).getTime();
  if (!Number.isFinite(expiryMs)) return true;

  return Date.now() > expiryMs;
};
