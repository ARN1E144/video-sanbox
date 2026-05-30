const listeners = {};

export function on(event, callback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }

  listeners[event].push(callback);
}

export function off(event, callback) {
  if (!listeners[event]) return;

  listeners[event] =
    listeners[event].filter(cb => cb !== callback);
}

export function emit(event, payload) {
  if (!listeners[event]) return;

  listeners[event].forEach(cb => cb(payload));
}