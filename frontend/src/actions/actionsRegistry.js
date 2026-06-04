// src/actions/actionsRegistry.js

import startStream from "./video/startStream";
import stopStream from "./video/stopStream";
import loadVideo from "./video/loadVideo";
import loadRemote from "./video/loadRemote";
import togglePlay from "./video/togglePlay";
import startCall from "./call/startCall";
import acceptCall from "./call/acceptCall";
import endCall from "./call/endCall";
import fetchAvailableCalls from "./call/fetchAvailableCalls";
import spotlightUser from "./call/spotlightUser";

import {
  setColor,
  applyThemeAction,
} from "../runtime/actions/themeActions";

/* =========================================================
   🔥 ACTION CONSTANTS
========================================================= */

export const ACTIONS = {
  AGORA_JOIN: "agora.joinCall",
  AGORA_LEAVE: "agora.leaveCall",
  AGORA_TOGGLE_VIDEO: "agora.toggleVideo",
  AGORA_TOGGLE_AUDIO: "agora.toggleMic",

  CALL_FETCH: "call.fetchAvailableCalls",
  CALL_START: "call.startCall",
  CALL_ACCEPT: "call.acceptCall",
  CALL_END: "call.endCall",
  CALL_SPOTLIGHT: "call.spotlightUser",

  VIDEO_START_STREAM: "video.startStream",
  VIDEO_STOP_STREAM: "video.stopStream",
  VIDEO_LOAD_VIDEO: "video.loadVideo",
  VIDEO_LOAD_REMOTE: "video.loadRemote",
  VIDEO_TOGGLE_PLAY: "video.togglePlay",

  THEME_SET_COLOR: "theme.setColor",
  THEME_APPLY: "theme.apply",
};

/* =========================================================
   🔥 CORE HELPERS (V1 SAFE GUARDS)
========================================================= */

const missingAgora = (ctx, method, label) => {
  console.warn(`⚠️ Agora ${method} not available in ctx`);
  ctx?.notify?.(`${label} unavailable`);
  return null;
};

const requireCallJoined = (ctx, label) => {
  if (!ctx?.get?.("call.joined")) {
    ctx?.notify?.(`${label} requires active call`);
    return false;
  }
  return true;
};

const sync = (ctx, patches = {}) => {
  if (!ctx?.set) return;
  for (const [k, v] of Object.entries(patches)) {
    ctx.set(k, v);
  }
};

const safeAgora = (ctx) => {
  if (!ctx?.agora?.isReady) {
    ctx?.notify?.("Call not ready");
    return null;
  }
  return ctx.agora;
};

/* =========================================================
   🔥 FACTORY
========================================================= */

const createAction = ({ value, label, category, run, targets = [] }) => ({
  value,
  label,
  category,
  run,
  targets,
});

/* =========================================================
   🔥 REGISTRY
========================================================= */

export const actionRegistry = {
  agora: {
    /* =====================================================
       JOIN CALL (BOOT STRAP STATE MACHINE START)
      ===================================================== */
      joinCall: createAction({
        value: ACTIONS.AGORA_JOIN,
        label: "Join Call",
        category: "agora",

        run: async (ctx, params) => {
          const agora = ctx?.agora;

          if (!agora?.joinCall) {
            return {
              ok: false,
              error: "AGORA_NOT_READY",
            };
          }

          // 🔥 HARD REQUIREMENT
          if (!params?.channel) {
            return {
              ok: false,
              error: "MISSING_CHANNEL",
            };
          }

          console.log("[JOINCALL PARAMS]", params);
          console.log("[CTX EXISTS]", !!ctx);
          console.log("[CTX SET EXISTS]", !!ctx.set);

          const res = await agora.joinCall({
            appId: ctx.get("agora.appId"),
            channel: params.channel,
            token: params.token || null,
            uid: ctx.get("user.id"),
          });

          // 🔥 SINGLE SOURCE OF TRUTH WRITE
          ctx.set("call.channel", params.channel);
          console.log("[AFTER SET]", ctx.get?.("call.channel"));

          ctx.set("call.joined", true);
          ctx.set("call.state", "connected");

          return {
            ok: true,
            channel: params.channel,
            uid: ctx.get("user.id"),
            sdk: res,
          };
        },

        targets: ["VideoFeed", "AgoraFeed"],
      }),

    /* =====================================================
       LEAVE CALL (RESET STATE MACHINE)
    ===================================================== */
    leaveCall: createAction({
      value: ACTIONS.AGORA_LEAVE,
      label: "Leave Call",
      category: "agora",

        run: async (ctx) => {
          const agora = ctx?.agora;

          if (!agora?.leaveCall) {
            ctx?.notify?.("Call engine unavailable");
            return;
          }
          await agora.leaveCall();

            ctx.set?.("call.joined", false);
            ctx.set?.("call.state", "disconnected");

            return {
              ok: true,
              action: ACTIONS.AGORA_LEAVE
            };
          
        },

      targets: ["CallPanel", "AgoraFeed", "VideoFeed"],
    }),

    /* =====================================================
       TOGGLE MIC (SAFE GUARDED LIFECYCLE)
    ===================================================== */
    toggleMic: createAction({
      value: ACTIONS.AGORA_TOGGLE_AUDIO,
      label: "Toggle Mic",
      category: "agora",

      run: async (ctx) => {
        const agora = safeAgora(ctx);

        if (!agora?.toggleMic) {
          ctx?.notify?.("Audio controls unavailable");
          return;
        }

        await agora.toggleMic();

        const current = ctx.get?.("media.micEnabled");
        ctx.set?.("media.micEnabled", !current);

        return {
          ok: true,
          action: ACTIONS.AGORA_TOGGLE_AUDIO,
          data: {
            micEnabled: !current
          }
        };
      },

      targets: ["VideoFeed", "AgoraFeed"],
    }),

    /* =====================================================
       TOGGLE VIDEO (SAFE GUARDED LIFECYCLE)
    ===================================================== */
    toggleVideo: createAction({
      value: ACTIONS.AGORA_TOGGLE_VIDEO,
      label: "Toggle Video",
      category: "agora",

      run: async (ctx) => {
        const agora = safeAgora(ctx);

        if (!agora?.toggleVideo) {
          ctx?.notify?.("Video controls unavailable");
          return;
        }

        await agora.toggleVideo();

        const current = ctx.get?.("media.videoEnabled");
        ctx.set?.("media.videoEnabled", !current);

        return {
          ok: true,
          action: ACTIONS.AGORA_TOGGLE_VIDEO,
          data: {
            videoEnabled: !current
          }
        };
      },

      targets: ["VideoFeed", "AgoraFeed"],
    }),
  },

  /* =========================================================
     CALL SYSTEM (UNCHANGED BUT SAFE)
  ========================================================= */
  call: {
  startCall: createAction({
    value: ACTIONS.CALL_START,
    label: "Start Call",
    category: "call",
    run: startCall,
    targets: ["CallPanel", "AgoraFeed"],
  }),

  acceptCall: createAction({
    value: ACTIONS.CALL_ACCEPT,
    label: "Accept Call",
    category: "call",
    run: acceptCall,
    targets: ["CallPanel", "AgoraFeed"],
  }),

  endCall: createAction({
    value: ACTIONS.CALL_END,
    label: "End Call",
    category: "call",
    run: endCall,
    targets: ["CallPanel", "AgoraFeed"],
  }),

  fetchAvailableCalls: createAction({
    value: ACTIONS.CALL_FETCH,
    label: "Fetch Calls",
    category: "call",
    run: fetchAvailableCalls,
    targets: ["CallPanel"],
  }),
},

  /* =========================================================
     VIDEO SYSTEM (UNCHANGED)
  ========================================================= */
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

  /* =========================================================
     THEMES (NEW)
  ========================================================= */

  theme: {
  setColor: createAction({
    value: ACTIONS.THEME_SET_COLOR,
    label: "Set Theme Color",
    category: "theme",

    run: setColor,

    targets: [],
  }),

  apply: createAction({
    value: ACTIONS.THEME_APPLY,
    label: "Apply Theme",
    category: "theme",

    run: applyThemeAction,

    targets: [],
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