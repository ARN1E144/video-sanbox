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
import toggleMic from "./system/toggleMic";

export const actionRegistry = {
  call: {
    startCall,
    acceptCall,
    endCall,
    fetchAvailableCalls,
  },

  video: {
    startStream,
    stopStream,
    loadVideo,
    loadRemote,
    togglePlay,
  },

  chat: {
    sendMessage
  },

  system: {
    toggleMic,
    api
  }
};