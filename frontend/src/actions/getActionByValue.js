// src/actions/getActionByValue.js
import { actionRegistry } from "../actions/actionsRegistry";

export function getActionByValue(value) {
  for (const categoryKey of Object.keys(actionRegistry)) {
    const category = actionRegistry[categoryKey];
    if (category[value]) return category[value];
  }
  return null;
}