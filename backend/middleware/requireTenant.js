// backend/middleware/requireTenant.js
export default function requireTenant(req, res, next) {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      error: "tenantId is missing from token. Re-login or call /auth/refresh with tenantId.",
    });
  }

  return next();
}
