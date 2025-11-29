import api from "../services/api";

export async function runAction(name, ctx, params = {}) {
  switch (name) {
    case "StartStream": {
      const { data } = await api.post("/startStream");
      ctx.updateBinding("VideoFeed", { src: data.streamUrl });
      return data;
    }

    case "StopStream": {
      await api.post("/stopStream");
      ctx.updateBinding("VideoFeed", { src: null });
      return true;
    }

    case "LoadVideo": {
      const { id } = params;
      const { data } = await api.get(`/videos/${id}`);
      ctx.updateBinding("VideoFeed", { src: data.videoUrl });
      return data;
    }

    case "SendMessage": {
      const { text } = params;
      const { data } = await api.post("/chat/send", { text });
      ctx.appendFeed("ChatPanel", data.message);
      return data;
    }

    case "ToggleMic": {
      const current = ctx.get("micState") || "on";
      const next = current === "on" ? "off" : "on";
      ctx.set("micState", next);
      return next;
    }

    // 🔽 NEW: generic toggle for a target element
    case "toggle": {
      const { targetId, condition } = params;
      if (!targetId) {
        console.warn("toggle action called without targetId");
        return null;
      }

      const currentBinding =
        (ctx.bindings && ctx.bindings[targetId]) || {};

      let nextEnabled;

      if (condition === "enabled") {
        nextEnabled = true;
      } else if (condition === "disabled") {
        nextEnabled = false;
      } else {
        // default: simple boolean toggle
        nextEnabled = !currentBinding.enabled;
      }

      ctx.updateBinding(targetId, {
        enabled: nextEnabled,
        playing: nextEnabled, // start/stop playback together
      });

      return { enabled: nextEnabled };
    }

    case "EndCall": {
      await api.post("/call/end");
      ctx.notify("Call ended");
      return true;
    }

    default:
      console.warn("Unknown action", name);
      return null;
  }
}
