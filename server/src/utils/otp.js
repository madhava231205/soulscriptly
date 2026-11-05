import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const hashOtp = (otp) => {
  return crypto
    .createHmac("sha256", process.env.OTP_HASH_SECRET)
    .update(otp)
    .digest("hex");
};

export const getOtpExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

export const canResendOtp = (sentAt) => {
  if (!sentAt) return true;

  const elapsedSeconds = (Date.now() - new Date(sentAt).getTime()) / 1000;

  return elapsedSeconds >= OTP_RESEND_COOLDOWN_SECONDS;
};

export const hasExceededOtpAttempts = (attempts) => {
  return attempts >= MAX_OTP_ATTEMPTS;
};