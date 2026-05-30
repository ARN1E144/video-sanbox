// src/constants/actionNames.js

export const ACTIONS = {
  /* =========================================================
   🎥 AGORA
  ========================================================= */

  AGORA_START_STREAM: "agora.startStream",
  AGORA_STOP_STREAM: "agora.stopStream",
  AGORA_TOGGLE_PLAY: "agora.togglePlay",
  AGORA_TOGGLE_VIDEO: "agora.toggleVideo",
  AGORA_TOGGLE_AUDIO: "agora.toggleAudio",
  AGORA_LEAVE_CALL: "agora.leaveCall",

  // OPTIONAL FUTURE ACTIONS
  AGORA_SCREEN_SHARE: "agora.screenShare",
  AGORA_STOP_SCREEN_SHARE: "agora.stopScreenShare",

  /* =========================================================
   📞 CALL
  ========================================================= */

  CALL_START: "call.startCall",
  CALL_ACCEPT: "call.acceptCall",
  CALL_END: "call.endCall",
  CALL_FETCH_AVAILABLE: "call.fetchAvailableCalls",
  CALL_LEAVE: "call.leaveCall",
  CALL_SPOTLIGHT_USER: "call.spotlightUser",

  /* =========================================================
   🎥 VIDEO
  ========================================================= */

  VIDEO_START_STREAM: "video.startStream",
  VIDEO_STOP_STREAM: "video.stopStream",
  VIDEO_LOAD_VIDEO: "video.loadVideo",
  VIDEO_LOAD_REMOTE: "video.loadRemote",
  VIDEO_TOGGLE_PLAY: "video.togglePlay",

  // OPTIONAL FUTURE
  VIDEO_TOGGLE_MUTE: "video.toggleMute",

  /* =========================================================
   💬 CHAT
  ========================================================= */

  CHAT_SEND_MESSAGE: "chat.sendMessage",

  /* =========================================================
   ⚙️ SYSTEM
  ========================================================= */

  SYSTEM_TOGGLE_MIC: "system.toggleMic",
  SYSTEM_API: "system.api",
};