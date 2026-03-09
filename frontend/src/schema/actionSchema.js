export function makeEmptyAction(type = "") {
  return {
    type,
    targetId: null,
    condition: null,
    params: {},
  };
}
