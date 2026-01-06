import jwt from "jsonwebtoken";

export function signAccessToken({ userId, tenantId, role }) {
  return jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

export function signRefreshToken({ userId }) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
}
