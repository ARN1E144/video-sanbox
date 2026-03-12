import AgoraRTC from "agora-rtc-sdk-ng";

class AgoraEngine {
  constructor() {
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.localAudio = null;
    this.localVideo = null;
    this.uid = null;
  }

  async init(appId, channel, token, uid) {
    this.uid = uid;

    await this.client.join(appId, channel, token, uid);

    this.localAudio = await AgoraRTC.createMicrophoneAudioTrack();
    this.localVideo = await AgoraRTC.createCameraVideoTrack();

    await this.client.publish([this.localAudio, this.localVideo]);

    return {
      audio: this.localAudio,
      video: this.localVideo
    };
  }
}

export default new AgoraEngine();