import express from "express";
import pkg from "agora-access-token";

const { RtcTokenBuilder, RtcRole } = pkg;
const router = express.Router();

router.get("/token", (req, res) => {

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  const channelName = req.query.channel;
  const uid = Number(req.query.uid);

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;


  if (!channelName || !uid) {
    return res.status(400).json({
      error:"Channel and UID required"
    });
  }


  try {

    const currentTimestamp = Math.floor(Date.now() / 1000);

    const privilegeExpiredTs =
      currentTimestamp + expirationTimeInSeconds;


    const token =
      RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );


    console.log("---- AGORA TOKEN ----");
    console.log("Channel:", channelName);
    console.log("UID:", uid);
    console.log("---------------------");


    res.json({
      token,
      uid,
      channelName,
      appId
    });


  } catch(err) {

    console.error(
      "Agora token error:",
      err
    );

    res.status(500).json({
      error:"Failed to generate token"
    });

  }

});

export default router;