import AgoraEngine from "../services/agoraEngine";

export function initRuntime(runtimeState) {
  // 🔥 CRITICAL: inject Agora engine into runtime
  runtimeState.agora = {
    joinCall: async (params) => {
      return AgoraEngine.init(
        params.appId,
        params.channel,
        params.token,
        params.uid
      );
    },

    leaveCall: async () => {
      await AgoraEngine.client.leave();
    },

    toggleMic: async () => {
      const audioTrack = AgoraEngine.localAudio;
      if (!audioTrack) return;

      const enabled = audioTrack.enabled;
      await audioTrack.setEnabled(!enabled);
    },

    toggleVideo: async () => {
      const videoTrack = AgoraEngine.localVideo;
      if (!videoTrack) return;

      const enabled = videoTrack.enabled;
      await videoTrack.setEnabled(!enabled);
    },
  };

  return runtimeState;
}