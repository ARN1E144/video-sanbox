import { ROLE_PERMISSIONS } from "./rolePermissions";


export function mapRuntimeRole(context = {}) {

   const {
    role,
    permissions = {},
  } = context || {};


  let runtimeRole;


  switch(role){

    case "owner":
      runtimeRole = "owner";
      break;

    case "admin":
      runtimeRole = "admin";
      break;

    case "builder":
    case "operative":
      runtimeRole = "host";
      break;

    case "member":
    case "client":
      runtimeRole = "participant";
      break;

    default:
      runtimeRole = "viewer";
  }


  const roleConfig =
    ROLE_PERMISSIONS[runtimeRole] ||
    ROLE_PERMISSIONS.viewer;


  return {

    role: runtimeRole,

    canBuild:
      permissions.canBuild ??
      roleConfig.canBuild,


    allowedElements:
      roleConfig.allowedElements || [],


    allowedActions:
      roleConfig.allowedActions || [],

  };
}