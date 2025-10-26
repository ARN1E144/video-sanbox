export function runAction(actionNameOrArray, payload = {}) {
  if (!actionNameOrArray) return;

  const actions = Array.isArray(actionNameOrArray)
    ? actionNameOrArray
    : [actionNameOrArray];

  (async () => {
    for (const action of actions) {
      await runSingleAction(action, payload);
    }
  })();
}

// 🧠 Run a single action
async function runSingleAction(actionName, payload = {}) {
  // 🪄 Helper: safely extract nested values
  function extractField(obj, path) {
    if (!path) return obj;
    return path
      .split(/\.|\[(\d+)\]/)
      .filter(Boolean)
      .reduce((acc, key) => acc?.[isNaN(key) ? key : Number(key)], obj);
  }

  // 🧠 Helper: interpolate {{field.path}} in template strings
  function interpolateTemplate(template, data) {
    if (typeof template !== "string") return template;
    return template.replace(/{{\s*([\w\.\[\]0-9_]+)\s*}}/g, (_, path) => {
      const value = extractField(data, path);
      return value !== undefined && value !== null ? value : "";
    });
  }

  console.log("🧠 runAction triggered:", actionName, payload);

  switch (actionName) {
    // 📡 API CALL
    case "apiCall": {
      if (!payload.url) {
        console.warn("⚠️ No URL provided for API Call action");
        return;
      }

      const method = (payload.method || "POST").toUpperCase();
      const customHeaders = Array.isArray(payload.headers)
        ? payload.headers.reduce((acc, h) => {
            if (h.key && h.value) acc[h.key] = h.value;
            return acc;
          }, {})
        : {};

      const headers = {
        "Content-Type": "application/json",
        ...customHeaders,
      };

      const fetchOptions = { method, headers };
      if (method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify({
          value: payload.value ?? null,
          label: payload.label ?? null,
          timestamp: new Date().toISOString(),
        });
      }

      try {
        const res = await fetch(payload.url, fetchOptions);
        const contentType = res.headers.get("content-type");
        const data = contentType?.includes("application/json")
          ? await res.json()
          : await res.text();

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let result = data;

        // 🧠 1. Extract specific field if configured
        if (payload.targetField) {
          try {
            result = extractField(data, payload.targetField);
            console.log("🔍 Extracted field result:", result);
          } catch (err) {
            console.warn("⚠️ Failed to extract field:", payload.targetField, err);
          }
        }

        // 🪄 2. Interpolate template if available
        let targetElement = null;
        if (payload.targetId && window.__ELEMENTS_STATE__) {
          targetElement = window.__ELEMENTS_STATE__.find(
            (el) => el.id === payload.targetId
          );
          if (targetElement?.props?.apiTemplate) {
            result = interpolateTemplate(targetElement.props.apiTemplate, data);
            console.log("🎨 Applied template:", result);
          }
        }

        console.log("✅ Final API Result:", result);

        // ✨ 3. Update the target element
        if (payload.targetId && window.__UPDATE_ELEMENT__) {
          if (targetElement?.type === "VideoFeed") {
            console.log("🎥 Updating VideoFeed streamUrl:", result);
            window.__UPDATE_ELEMENT__(payload.targetId, {
              props: {
                ...targetElement.props,
                streamUrl: String(result),
              },
            });
          } else {
            console.log("📝 Updating element label:", result);
            window.__UPDATE_ELEMENT__(payload.targetId, {
              props: {
                ...targetElement.props,
                label:
                  typeof result === "string" ? result : JSON.stringify(result),
              },
            });
          }
        } else {
          console.warn("⚠️ No target element found or update function missing");
        }
      } catch (err) {
        console.error("❌ API Call failed:", err);
      }

      break;
    }

    // 🌀 Future: Add animation action
    case "animateElement": {
      if (!payload.targetId) return;
      console.log(`✨ Animate element ${payload.targetId}`);
      break;
    }

    default:
      console.warn("⚠️ Unknown action:", actionName, payload);
  }
}
