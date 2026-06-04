export const createAgoraAdapter = (agoraClient) => {
  return {
    joinCall: async (params) => {
      return agoraClient.join(params);
    },

    leaveCall: async () => {
      return agoraClient.leave();
    },

    toggleMic: async () => {
      return agoraClient.toggleMic();
    },

    toggleVideo: async () => {
      return agoraClient.toggleVideo();
    },
  };
};