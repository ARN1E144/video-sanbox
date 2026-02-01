import jwt from "jsonwebtoken"; // ← THIS WAS MISSING

export function requireAuth(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

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

    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
    };

    console.log("[requireAuth] Authenticated user:", req.user);
    return next();
  } catch (err) {
    console.error("[requireAuth] JWT error:", err.message);
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}
