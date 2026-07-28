import { actionRegistry } from "../actions/actionsRegistry"d;

export const isValidAction = (name) => {
  const parts = name.split(".");
  let node = actionRegistry;

  for (const p of parts) {
    node = node?.[p];
    if (!node) return false;
  }

  return typeof node?.run === "function";
};