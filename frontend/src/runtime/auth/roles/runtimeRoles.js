// src/runtime/roles/runtimeRoles.js


export const RUNTIME_ROLES = Object.freeze([
  "owner",
  "admin",
  "host",
  "participant",
]);


export function isValidRuntimeRole(role){

  return RUNTIME_ROLES.includes(role);

}