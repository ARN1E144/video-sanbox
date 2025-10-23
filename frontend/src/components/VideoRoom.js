import { useEffect, useRef } from "react";
import { getAgoraToken } from "../services/api";
import { createClient, createMicrophoneAndCameraTracks } from "agora-rtc-sdk-ng";

export default function VideoRoom({ channel }) {
  const localRef = useRef();
  const remoteRef = useRef();

  useEffect(() => {
    const initAgora = async () => {
      const client = createClient({ mode: "rtc", codec: "vp8" });
      const { token, uid, appId } = await getAgoraToken(channel);

      const [localAudioTrack, localVideoTrack] = await createMicrophoneAndCameraTracks();
      await client.join(appId, channel, token, uid);
      await client.publish([localAudioTrack, localVideoTrack]);

      localVideoTrack.play(localRef.current);

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") user.videoTrack.play(remoteRef.current);
      });
    };

    initAgora();

    return () => {
      // cleanup if needed
    };
  }, [channel]);

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div>
        <h4>Local Video</h4>
        <div ref={localRef} style={{ width: 320, height: 240, background: "#000" }} />
      </div>
      <div>
        <h4>Remote Video</h4>
        <div ref={remoteRef} style={{ width: 320, height: 240, background: "#000" }} />
      </div>
    </div>
  );
}
