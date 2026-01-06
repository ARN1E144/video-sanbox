// backend/middleware/requirePermission.js
import Membership from "../models/Membership.js";

export default function requirePermission(permissionKey) {
  return async function (req, res, next) {
    const { userId, tenantId } = req.user || {};
    if (!userId || !tenantId) {
      return res.status(401).json({ error: "Missing auth context" });
    }

    const membership = await Membership.findOne({ userId, tenantId }).select("role permissions");
    if (!membership) return res.status(403).json({ error: "No membership for tenant" });

    const allowed =
      membership.role === "owner" ||
      membership.role === "admin" ||
      membership.permissions?.[permissionKey] === true;

    if (!allowed) {
      return res.status(403).json({ error: `Missing permission: ${permissionKey}` });
    }

    req.membership = membership; // handy downstream
    return next();
  };
}
