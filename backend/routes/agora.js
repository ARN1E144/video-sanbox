import express from "express";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;

const router = express.Router();

router.get("/token", (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const channelName = req.query.channel;
  const uid = Math.floor(Math.random() * 100000);
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;

  console.log("[AGORA TOKEN] Generating Agora token for channel Rote Hit");  
  console.log("[AGORA CHANNEL] Channel Name:", channelName); 

  if (!channelName) {
    return res.status(400).json({ error: "Channel name is required" });
  }

  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    console.log("[AGORA TOKEN] Token generated successfully", token);

    res.json({ token, uid, channelName, appId });
  } catch (err) {
    console.error("Agora token error:", err);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

export default router;
