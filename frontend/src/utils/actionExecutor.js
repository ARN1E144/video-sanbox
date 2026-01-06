// src/utils/actionExecutor.js
import api from "../services/api";

/**
 * runAction(name, ctx, params)
 * - name: string (e.g. "toggle", "api")
 * - ctx:  ActionContext value (from useActionContext)
 * - params: extra data from the triggering element
 */
export async function runAction(name, ctx, params = {}) {
  console.log("[runAction] called", { name, params }); // 🔍 top-level trace

  switch (name) {
    case "StartStream": {
      console.log("[runAction:StartStream] firing");
      const { data } = await api.post("/startStream");
      console.log("[runAction:StartStream] response", data);
      ctx.updateBinding("VideoFeed", { src: data.streamUrl });
      return data;
    }

    case "StopStream": {
      console.log("[runAction:StopStream] firing");
      await api.post("/stopStream");
      ctx.updateBinding("VideoFeed", { src: null });
      return true;
    }

    case "LoadVideo": {
      const { id } = params;
      console.log("[runAction:LoadVideo] id", id);
      const { data } = await api.get(`/videos/${id}`);
      console.log("[runAction:LoadVideo] response", data);
      ctx.updateBinding("VideoFeed", { src: data.videoUrl });
      return data;
    }

     case "SendMessage": {
      const { text, value, message, targetId } = params;

      // allow multiple possible sources
      const payloadText = text ?? value ?? message ?? "";

      console.log("[runAction:SendMessage] payloadText", payloadText);
      console.log("[runAction:SendMessage] targetId", targetId);

      // You can still call your API if you want
      const { data } = await api.post("/chat/send", { text: payloadText });
      console.log("[runAction:SendMessage] response", data);

      // ✅ append into the specific ChatPanel instance
      if (targetId) {
        ctx.appendFeed(targetId, data.message ?? payloadText);
      } else {
        // fallback (old behaviour) so you don't break anything immediately
        console.warn(
          "[runAction:SendMessage] No targetId provided; falling back to 'ChatPanel' key"
        );
        ctx.appendFeed("ChatPanel", data.message ?? payloadText);
      }

      return data;
    }

    case "ToggleMic": {
      const current = ctx.get("micState") || "on";
      const next = current === "on" ? "off" : "on";
      ctx.set("micState", next);

      // ✅ make the clicked MicButton visually react
      if (params?.elementId) {
        ctx.updateBinding(params.elementId, {
          micState: next,
          active: next === "on",
          label: next === "on" ? "Mic On" : "Mic Off",
        });
      }

      return next;
    }


    // ✅ Generic toggle for a target element
    case "toggle": {
      const { targetId, condition } = params;
      console.log("[runAction:toggle] params", { targetId, condition });

      if (!targetId) {
        console.warn("toggle action called without targetId");
        return null;
      }

      const currentBinding =
        (ctx.bindings && ctx.bindings[targetId]) || {};

      console.log("[runAction:toggle] currentBinding", currentBinding);

      let nextEnabled;

      if (condition === "enabled") {
        nextEnabled = true;
      } else if (condition === "disabled") {
        nextEnabled = false;
      } else {
        // default: simple boolean toggle
        nextEnabled = !currentBinding.enabled;
      }

      console.log("[runAction:toggle] nextEnabled", nextEnabled);

      ctx.updateBinding(targetId, {
        enabled: nextEnabled,
        playing: nextEnabled, // start/stop playback together
      });

      console.log("[runAction:toggle] updateBinding called for", targetId);

      return { enabled: nextEnabled };
    }

    // ✅ API Call – works for Text, VideoFeed, etc.
    case "api": {
      const {
        // URL sources
        url: directUrl,
        endpoint,
        apiUrl,

        // HTTP config
        method = "GET",
        headers,
        body,

        // Targeting
        targetId,
        targetField,   // e.g. "text" for Text, "src" for VideoFeed
        responsePath,  // optional: "user.name"

        // Auth
        apiIncludeAuth,
        apiAuthScheme,
        apiAuthToken,
      } = params;

      console.log("[runAction:api] raw params", {
        directUrl,
        endpoint,
        apiUrl,
        method,
        headers,
        body,
        targetId,
        targetField,
        responsePath,
        apiIncludeAuth,
        apiAuthScheme,
        apiAuthToken,
      });

      // 🔗 Accept url OR endpoint OR apiUrl
      const url = directUrl || endpoint || apiUrl;
      console.log("[runAction:api] resolved url", url);

      if (!url) {
        console.warn("api action called without url");
        ctx.notify?.("API URL is missing");
        return null;
      }

      const httpMethod = method.toLowerCase();

      // Build headers (including optional Authorization)
      const finalHeaders = { ...(headers || {}) };
      if (apiIncludeAuth && apiAuthToken) {
        finalHeaders.Authorization = `${apiAuthScheme || "Bearer"} ${apiAuthToken}`;
      }

      const config = { method: httpMethod, url };

      if (Object.keys(finalHeaders).length > 0) {
        config.headers = finalHeaders;
      }

      // Only attach body for methods that typically support it
      if (
        body &&
        ["post", "put", "patch", "delete"].includes(httpMethod)
      ) {
        config.data = body;
      }

      console.log("[runAction:api] axios config", config);

      try {
        const { data } = await api(config);
        console.log("[runAction:api] raw response data", data);

        if (data == null) {
          ctx.notify?.("API returned an empty response");
          return null;
        }

        // Optional: drill into nested response
        const pickByPath = (obj, path) => {
          if (!path || obj == null) return obj;
          return path.split(".").reduce((acc, key) => {
            if (acc == null) return undefined;
            return acc[key];
          }, obj);
        };

        let value = pickByPath(data, responsePath);
        console.log("[runAction:api] value after responsePath", {
          responsePath,
          value,
        });

        if (value === undefined) value = data;

        // 🧠 Special case: VideoFeed.src
        // if targetField === "src" but the value is not obviously a URL,
        // fall back to using the endpoint URL
        if (targetField === "src") {
          const looksLikeUrl =
            typeof value === "string" && /^https?:\/\//i.test(value.trim());
          console.log("[runAction:api] src target; looksLikeUrl?", {
            value,
            looksLikeUrl,
          });
          if (!looksLikeUrl) {
            value = url;
          }
        }

        console.log("[runAction:api] final value for target", {
          targetId,
          targetField,
          value,
        });

        // 🎯 Bind into target element if provided
        if (targetId) {
          if (targetField) {
            console.log("[runAction:api] calling updateBinding with", {
              targetId,
              patch: { [targetField]: value },
            });
            ctx.updateBinding(targetId, { [targetField]: value });
          } else if (typeof value === "object" && !Array.isArray(value)) {
            console.log("[runAction:api] merging object into target", {
              targetId,
              value,
            });
            ctx.updateBinding(targetId, value);
          } else {
            console.log(
              "[runAction:api] targetId set but no targetField and value is not object; no binding applied"
            );
          }
        } else {
          console.log("[runAction:api] no targetId – not binding to any element");
        }

        return value;
      } catch (err) {
        console.error("API action failed:", err);
        ctx.notify?.("API Call failed – see console for details");
        return null;
      }
    }

    case "StartCall": {
      console.log("[runAction:StartCall] firing");
      await api.post("/call/start");
      ctx.notify("Call started");
      return true;
    }

    case "EndCall": {
      console.log("[runAction:EndCall] firing");
      await api.post("/call/end");
      ctx.notify("Call ended");
      return true;
    }

    default:
      console.warn("Unknown action", name, "with params", params);
      return null;
  }
}
