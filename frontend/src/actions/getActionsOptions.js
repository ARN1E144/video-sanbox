import { actionRegistry } from "./actionsRegistry";

export function getActionOptions() {
  const options = [];

  Object.entries(actionRegistry).forEach(([category, actions]) => {
    Object.entries(actions).forEach(([name, action]) => {
      options.push({
        value: `${category}.${name}`,
        label: action.label || name,
        category: category,
      });
    });
  });

  return options;
}