import { actionRegistry } from "./actionsRegistry";

export function getAvailableActions(role = "participant") {
  const allowed = {};

  Object.entries(actionRegistry).forEach(([group, actions]) => {
    allowed[group] = {};

    Object.entries(actions).forEach(([name, action]) => {
      if (!action.roles || action.roles.includes(role)) {
        allowed[group][name] = action;
      }
    });
  });

  return allowed;
}