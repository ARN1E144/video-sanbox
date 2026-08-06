import { ROLE_PERMISSIONS } from "./roles/rolePermissions";
import { mapRuntimeRole } from "./roles/runtimeRoleMapper";


export function resolveRoleContext({
    role,
    permissions = {}
}) {


    const runtimeRole = mapRuntimeRole({
        role,
        permissions
    });


    const roleConfig =
        ROLE_PERMISSIONS[runtimeRole.role] ||
        ROLE_PERMISSIONS.viewer;


    return {

        role: runtimeRole.role,


        canBuild:
            permissions.canBuild ??
            roleConfig.canBuild,


        allowedElements:
            roleConfig.allowedElements || [],


        allowedActions:
            roleConfig.allowedActions || []

    };

}