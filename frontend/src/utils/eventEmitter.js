// src/utils/eventEmitter.js
export function emitEvent(props, eventName, payload = {}) {
  if (typeof props.emit === "function") {
    props.emit(eventName, payload);
  } else {
    console.warn(`[emitEvent] No emit handler for ${eventName}`, payload);
  }
}
