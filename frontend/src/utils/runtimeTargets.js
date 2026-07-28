export const RUNTIME_TARGET_TYPES = [
  "AgoraFeed",
  "VideoFeed",
];

export function getDefaultRuntimeTarget(elements = []) {
  return (
    elements.find((el) =>
      RUNTIME_TARGET_TYPES.includes(el.type)
    ) || null
  );
}