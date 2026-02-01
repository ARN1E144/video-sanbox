export default function requireTenant(req, res, next) {
  const tenantId =
    req.user?.tenantId ||
    req.params?.tenantId ||
    req.body?.tenantId;

    console.log("[requireTenant] Resolved tenantId:", tenantId);

  if (!tenantId) {
    return res.status(401).json({ error: "Tenant context missing" });
  }

  req.user.tenantId = tenantId;
  next();
}
