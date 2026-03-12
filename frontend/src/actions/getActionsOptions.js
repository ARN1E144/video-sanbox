import { actionRegistry } from "./actionsRegistry";

 export function getActionOptions() {
  const options = [];

  Object.entries(actionRegistry).forEach(([category, actionsObj]) => {
    Object.entries(actionsObj).forEach(([actionName, actionFn]) => {
      options.push({
        value: `${category}.${actionName}`, // <-- fully namespaced
        label: actionFn.label || actionName,
        category: category.charAt(0).toUpperCase() + category.slice(1),
      });
    });
  });

  return options;
}