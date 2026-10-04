import { ROLE_PERMISSIONS } from "./rolePermissions";



export function mapRuntimeRole(context = {}) {

  const {
    role,
    projectRole,
    permissions = {},
  } = context || {};


  let runtimeRole;


  // =====================================================
  // TENANT-LEVEL ROLES
  // =====================================================

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

      // -------------------------------------------------
      // Project access takes precedence when available.
      // -------------------------------------------------

      switch(projectRole){

        case "admin":

          runtimeRole = "admin";

          break;


        case "editor":

          runtimeRole = "host";

          break;


        case "viewer":

          runtimeRole = "viewer";

          break;


        default:

          // No project role means we preserve the
          // existing participant behaviour.
          runtimeRole = "participant";

          break;

      }

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
