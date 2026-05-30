// src/actions/actionsRegistry.js

import startCall from "./call/startCall";
import acceptCall from "./call/acceptCall";
import endCall from "./call/endCall";
import fetchAvailableCalls from "./call/fetchAvailableCalls";
import spotlightUser from "./call/spotlightUser";

import startStream from "./video/startStream";
import stopStream from "./video/stopStream";
import loadVideo from "./video/loadVideo";
import loadRemote from "./video/loadRemote";
import togglePlay from "./video/togglePlay";

import sendMessage from "./chat/sendMessage";

/* =========================================================
   🔥 ACTION CONSTANTS
========================================================= */

export const ACTIONS = {
  AGORA_START_STREAM: "agora.joinCall",
  AGORA_STOP_STREAM: "agora.leaveCall",
  AGORA_TOGGLE_VIDEO: "agora.toggleVideo",
  AGORA_TOGGLE_AUDIO: "agora.toggleMic",
  AGORA_LEAVE_CALL: "agora.leaveCall",

  CALL_FETCH: "call.fetchAvailableCalls",
  CALL_SPOTLIGHT: "call.spotlightUser",

  VIDEO_START_STREAM: "video.startStream",
  VIDEO_STOP_STREAM: "video.stopStream",
  VIDEO_LOAD_VIDEO: "video.loadVideo",
  VIDEO_LOAD_REMOTE: "video.loadRemote",
  VIDEO_TOGGLE_PLAY: "video.togglePlay",

  CHAT_SEND_MESSAGE: "chat.sendMessage",
};

/* =========================================================
   🔥 HELPERS
========================================================= */

const missingAgora = (ctx, method, label) => {
  console.warn(`⚠️ Agora ${method} not available in ctx`);
  ctx?.notify?.(`${label} unavailable`);
  return null;
};

/**
 * 🔥 SINGLE SOURCE OF TRUTH FOR STATE SYNC
 */
const sync = (ctx, patches = {}) => {
  if (!ctx?.set) return;

  Object.entries(patches).forEach(([key, value]) => {
    ctx.set(key, value);
  });
};

/* =========================================================
   🔥 FACTORY
========================================================= */

const createAction = ({
  value,
  label,
  category,
  run,
  targets = [],
  params,
}) => ({
  value,
  label,
  category,
  run,
  targets,
  params: params || {},
});

/* =========================================================
   🔥 REGISTRY
========================================================= */

export const actionRegistry = {
  agora: {
    joinCall: createAction({
      value: ACTIONS.AGORA_START_STREAM,
      label: "Join Call",
      category: "agora",

      run: async (ctx, params) => {
        if (!ctx?.agora?.joinCall) {
          return missingAgora(ctx, "joinCall", "Join call");
        }

        const res = await ctx.agora.joinCall(params);

        sync(ctx, {
          "call.joined": true,
          "call.status": "connected",
        });

        return res;
      },

      targets: ["VideoFeed", "AgoraFeed"],
    }),

    leaveCall: createAction({
      value: ACTIONS.AGORA_LEAVE_CALL,
      label: "Leave Call",
      category: "agora",

      run: async (ctx) => {
        if (!ctx?.agora?.leaveCall) {
          return missingAgora(ctx, "leaveCall", "Leave call");
        }

        const res = await ctx.agora.leaveCall();

        sync(ctx, {
          "call.joined": false,
          "call.status": "disconnected",
        });

        return res;
      },

      targets: ["CallPanel", "AgoraFeed", "VideoFeed"],
    }),

    toggleVideo: createAction({
      value: ACTIONS.AGORA_TOGGLE_VIDEO,
      label: "Toggle Video",
      category: "agora",

      run: async (ctx) => {
        if (!ctx?.agora?.toggleVideo) {
          return missingAgora(ctx, "toggleVideo", "Video controls");
        }

        await ctx.agora.toggleVideo();

        const current = ctx.get?.("media.videoEnabled");

        sync(ctx, {
          "media.videoEnabled": !current,
        });
      },

      targets: ["VideoFeed", "AgoraFeed"],
    }),

    toggleMic: createAction({
      value: ACTIONS.AGORA_TOGGLE_AUDIO,
      label: "Toggle Mic",
      category: "agora",

      run: async (ctx) => {
        if (!ctx?.agora?.toggleMic) {
          return missingAgora(ctx, "toggleMic", "Audio controls");
        }

        await ctx.agora.toggleMic();

        const current = ctx.get?.("media.micEnabled");

        sync(ctx, {
          "media.micEnabled": !current,
        });
      },

      targets: ["VideoFeed", "AgoraFeed"],
    }),
  },

  call: {
    fetchAvailableCalls: createAction({
      value: ACTIONS.CALL_FETCH,
      label: "Fetch Calls",
      category: "call",
      run: fetchAvailableCalls,
      targets: ["CallPanel"],
    }),

    spotlightUser: createAction({
      value: ACTIONS.CALL_SPOTLIGHT,
      label: "Spotlight User",
      category: "call",
      run: spotlightUser,
      targets: ["VideoFeed", "AgoraFeed"],
    }),
  },

  video: {
    startStream: createAction({
      value: ACTIONS.VIDEO_START_STREAM,
      label: "Start Stream",
      category: "video",
      run: startStream,
      targets: ["VideoFeed"],
    }),

    stopStream: createAction({
      value: ACTIONS.VIDEO_STOP_STREAM,
      label: "Stop Stream",
      category: "video",
      run: stopStream,
      targets: ["VideoFeed"],
    }),

    loadVideo: createAction({
      value: ACTIONS.VIDEO_LOAD_VIDEO,
      label: "Load Video",
      category: "video",
      run: loadVideo,
      targets: ["VideoFeed"],
    }),

    loadRemote: createAction({
      value: ACTIONS.VIDEO_LOAD_REMOTE,
      label: "Load Remote Stream",
      category: "video",
      run: loadRemote,
      targets: ["VideoFeed"],
    }),

    togglePlay: createAction({
      value: ACTIONS.VIDEO_TOGGLE_PLAY,
      label: "Toggle Play",
      category: "video",
      run: togglePlay,
      targets: ["VideoFeed"],
    }),
  },
};

/* =========================================================
   🔥 HELPERS
========================================================= */

export const getAction = (value) => {
  const [category, name] = value.split(".");
  return actionRegistry?.[category]?.[name] || null;
};

export const getAllActions = () =>
  Object.values(actionRegistry).flatMap((cat) =>
    Object.values(cat)
  );