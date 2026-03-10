import startCall from "./call/startCall";
import acceptCall from "./call/acceptCall";
import endCall from "./call/endCall";

import startStream from "./video/startStream";
import stopStream from "./video/stopStream";

import sendMessage from "./chat/sendMessage";

import toggle from "./system/toggleMic";
import api from "../../src/services/api";
import loadVideo from "./video/loadVideo";
import loadRemote from "./video/loadRemote";
import togglePlay from "./video/togglePlay";
import fetchAvailableCalls from "./call/fetchAvailableCalls";
import leaveCall from "./call/leaveCall";
import spotlightUser from "./call/spotlightUser";
// import toggleCamera from "./system/toggleCamera";
import toggleMic from "./system/toggleMic";

export const actionRegistry = {
  call: {
    startCall: { run: startCall, roles: ["host", "participant"] },
    acceptCall: { run: acceptCall, roles: ["participant"] },
    endCall: { run: endCall, roles: ["host", "participant"] },
    fetchAvailableCalls: { run: fetchAvailableCalls, roles: ["participant"] },
    leaveCall: { run: leaveCall, roles: ["host", "participant"] },
    spotlightUser: { run: spotlightUser, roles: ["host"] },
  },

  video: {
    startStream: { run: startStream, roles: ["host", "participant"] },
    stopStream: { run: stopStream, roles: ["host", "participant"] },
    loadVideo: { run: loadVideo, roles: ["host", "participant"] },
    loadRemote: { run: loadRemote, roles: ["host", "participant"] },
    togglePlay: { run: togglePlay, roles: ["host", "participant"] },
  },

  chat: {
    sendMessage: { run: sendMessage, roles: ["host", "participant"] },
  },

  system: {
    toggle: { run: toggleMic, roles: ["host", "participant"] },
    // toggleCamera: { run: toggleCamera, roles: ["host", "participant"] },
    api, // optional: make api accessible globally if needed
  }
};