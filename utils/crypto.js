import crypto from "node:crypto";

/**
 * Generate a secure random token
 */
export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token using SHA-256
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Compare a raw token with a hashed token
 */
export const compareToken = (rawToken, hashedToken) => {
  const hashed = hashToken(rawToken);
  return hashed === hashedToken;
};

