import crypto from "crypto";

const parsePositiveInt = (value, fallbackValue) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
};

const resolveOTPExpirySeconds = () =>
  parsePositiveInt(process.env.OTP_EXPIRY_SECONDS, 60);

const resolveOTPResendCooldownSeconds = () =>
  parsePositiveInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 2);

export const getOTPExpirySeconds = () => resolveOTPExpirySeconds();

export const getOTPResendCooldownSeconds = () => resolveOTPResendCooldownSeconds();

// Generate a 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
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
