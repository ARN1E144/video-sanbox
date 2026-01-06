// backend/middleware/requireAuth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_ACCESS_SECRET is not set" });
    }

    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const payload = jwt.verify(token, secret);

    // Expected payload from signAccessToken:
    // { userId, tenantId, role, iat, exp }
    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}
