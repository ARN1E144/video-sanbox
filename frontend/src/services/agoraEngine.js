import AgoraRTC from "agora-rtc-sdk-ng";


class AgoraEngine {

  constructor() {

    this.appId = process.env.REACT_APP_AGORA_APP_ID;

    this.uid = null;

    this.client = AgoraRTC.createClient({
      mode:"rtc",
      codec:"vp8",
    });


    this.localAudioTrack = null;
    this.localVideoTrack = null;


    this.isReady = false;
    this.isJoining = false;
    this.isLeaving = false;


    this.micLock = false;
    this.videoLock = false;

  }

    generateUid() {

    return Math.floor(
      Math.random() * 100000
    );

  }
  
  // async getToken(channel, uid) {

  //   const response = await fetch(
  //     `/api/agora/token?channel=${channel}&uid=${uid}`
  //   );


  //   if (!response.ok) {
  //     throw new Error(
  //       "Failed to fetch Agora token"
  //     );
  //   }


  //   const data = await response.json();


  //   if (!data.token) {
  //     throw new Error(
  //       "Agora token missing"
  //     );
  //   }


  //   return data.token;
  // }
  
  async getToken(channel, uid) {

  const api = process.env.REACT_APP_SERVER_API;

  const url =
    `${api}/api/agora/token?channel=${channel}&uid=${uid}`;

  console.log("[Agora] Fetching token:", url);

  const response = await fetch(url);

  console.log(
    "[Agora] Status:",
    response.status,
    response.headers.get("content-type")
  );

  const text = await response.text();

  console.log("[Agora] Response:", text);

  const data = JSON.parse(text);

  return data.token;
}


  async joinCall({
  channel,
  
  }) {

  if (!this.appId || !channel) {

    console.warn(
      "[Agora] join blocked - missing params",
      {
        appId:this.appId,
        channel,
      }
    );

    return false;
  }



  if (this.isJoining || this.isReady) {

    console.warn(
      "[Agora] join ignored - already active"
    );

    return false;
  }



  this.isJoining = true;


  try {


    this.uid = this.generateUid();

    console.log(
      "%c[Agora]%c generated uid",
      "color: #06B6D4; font-weight: bold;", // Cyan/Teal tag
      "font-weight: bold;",               // Bold label text
      this.uid
    );

  const token =
    await this.getToken(
      channel,
      this.uid
    );


  await this.client.join(
    this.appId,
    channel,
    token,
    this.uid
  );


    this.localAudioTrack =
      await AgoraRTC.createMicrophoneAudioTrack();


    this.localVideoTrack =
      await AgoraRTC.createCameraVideoTrack();



    await this.client.publish([
      this.localAudioTrack,
      this.localVideoTrack,
    ]);


    this.isReady = true;


    console.log(
      "[Agora] joined successfully"
    );


    return true;


  } catch(err) {


    console.error(
      "[Agora] join failed",
      err
    );


    await this.cleanup();


    return false;


  } finally {

    this.isJoining = false;

  }

}





  async leaveCall(){

  try {

    console.log("[Agora] leaving call");


    // Stop microphone
    if(this.localAudioTrack){

      this.localAudioTrack.stop();
      this.localAudioTrack.close();

      this.localAudioTrack=null;
    }


    // Stop camera
    if(this.localVideoTrack){

      this.localVideoTrack.stop();
      this.localVideoTrack.close();

      this.localVideoTrack=null;
    }


    // Leave channel
    if(this.client){

      await this.client.leave();

      this.uid = null;

    }


    this.uid=null;


    console.log("[Agora] cleaned");


    return true;


  } catch(error){

    console.error(
      "[Agora] leave failed",
      error
    );

    return false;
  }

}






  async cleanup() {


    try {


      if (this.localAudioTrack) {

        this.localAudioTrack.close();

      }



      if (this.localVideoTrack) {

        this.localVideoTrack.close();

      }



      this.localAudioTrack = null;
      this.localVideoTrack = null;



      if (this.client.connectionState !== "DISCONNECTED") {

        await this.client.leave();

        this.uid = null;

      }


    } catch(err) {


      console.warn(
        "[Agora] cleanup warning",
        err
      );


    }



    this.isReady = false;


  }

 async toggleMic() {

    if (
      !this.isReady ||
      !this.localAudioTrack
    ) {

      console.warn(
        "[Agora] mic ignored - unavailable"
      );

      return false;
    }


    if (this.micLock) {
      return false;
    }


    this.micLock = true;

    try {

      await this.localAudioTrack.setEnabled(
        !this.localAudioTrack.enabled
      );

      return true;

    } catch(err) {

      console.error(
        "[Agora] mic toggle failed",
        err
      );

      return false;

    } finally {

      this.micLock = false;

    }
  }

  async toggleVideo() {


    if (
      !this.isReady ||
      !this.localVideoTrack
    ) {

      console.warn(
        "[Agora] video ignored - unavailable"
      );

      return;

    }



    if (this.videoLock) {

      console.warn(
        "[Agora] video toggle locked"
      );

      return;

    }



    this.videoLock = true;



    try {


      await this.localVideoTrack.setEnabled(
        !this.localVideoTrack.enabled
      );


    } catch(err) {


      console.error(
        "[Agora] video toggle failed",
        err
      );


    } finally {


      this.videoLock = false;


    }


  }



}



export default new AgoraEngine();