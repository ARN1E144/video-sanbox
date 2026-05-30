import { actionRegistry } from "./actionsRegistry";

export function getActionByValue(value) {
  if (!value) return null;

  const [category, name] = value.split(".");

  return actionRegistry?.[category]?.[name] || null;
}