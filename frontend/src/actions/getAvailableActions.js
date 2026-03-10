import { actionRegistry } from "./actionsRegistry";

export function getAvailableActions(role = "participant") {

  const allowed = {};

  Object.entries(actionRegistry).forEach(([groupName, group]) => {

    allowed[groupName] = {};

    Object.entries(group).forEach(([actionName, action]) => {

      if (!action.roles || action.roles.includes(role)) {
        allowed[groupName][actionName] = action;
      }

    });

  });

  return allowed;
}