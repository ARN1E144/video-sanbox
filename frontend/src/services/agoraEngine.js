import AgoraRTC from "agora-rtc-sdk-ng";

class AgoraEngine {
  constructor() {
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    this.localAudioTrack = null;
    this.localVideoTrack = null;

    this.uid = null;
    this.isReady = false;
  }

  async joinCall({ appId, channel, token, uid }) {
    if (!appId || !channel || !uid) {
      console.warn("[Agora] joinCall blocked - missing params", {
        appId,
        channel,
        uid,
        token,
      });
      return false;
    }

    this.uid = uid;

    try {
      await this.client.join(appId, channel, token || null, uid);

      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

      await this.client.publish([
        this.localAudioTrack,
        this.localVideoTrack,
      ]);

      this.isReady = true;

      return true;
    } catch (err) {
      console.error("[Agora] joinCall failed", err);
      return false;
    }
  }

  async leaveCall() {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();

    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.isReady = false;

    await this.client.leave();
  }

  toggleMic() {
    if (!this.localAudioTrack) {
      console.warn("[Agora] toggleMic ignored - no audio track");
      return;
    }

    const enabled = this.localAudioTrack.enabled;

    this.localAudioTrack.setEnabled(!enabled);
  }

  toggleVideo() {
    if (!this.localVideoTrack) {
      console.warn("[Agora] toggleVideo ignored - no video track");
      return;
    }

    const enabled = this.localVideoTrack.enabled;

    this.localVideoTrack.setEnabled(!enabled);
  }
}


export default new AgoraEngine();