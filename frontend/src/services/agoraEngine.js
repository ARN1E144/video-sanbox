// src/services/agoraEngine.js

import AgoraRTC from "agora-rtc-sdk-ng";


class AgoraEngine {

  constructor() {

    // =====================================================
    // CONFIG
    // =====================================================

    this.appId =
      process.env.REACT_APP_AGORA_APP_ID;


    // =====================================================
    // AGORA CLIENT
    // =====================================================

    this.client =
      AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });


    // =====================================================
    // IDENTITY
    // =====================================================

    this.uid = null;
    this.channel = null;


    // =====================================================
    // LOCAL TRACKS
    // =====================================================

    this.localAudioTrack = null;
    this.localVideoTrack = null;


    // =====================================================
    // REMOTE USERS
    //
    // IMPORTANT:
    // This Map is INTERNAL engine state.
    //
    // It is allowed to contain Agora User / Track objects.
    // These objects must NEVER be written directly into
    // RuntimeState.
    // =====================================================

    this.remoteUsers = new Map();


    // =====================================================
    // STATE
    // =====================================================

    this.isReady = false;
    this.isJoining = false;
    this.isLeaving = false;


    // =====================================================
    // LOCKS
    // =====================================================

    this.micLock = false;
    this.videoLock = false;


    // =====================================================
    // SUBSCRIBERS
    // =====================================================

    this.listeners = new Map();


    // =====================================================
    // EVENT HANDLERS
    // =====================================================

    this.handleUserPublished =
      this.handleUserPublished.bind(this);

    this.handleUserUnpublished =
      this.handleUserUnpublished.bind(this);

    this.handleUserLeft =
      this.handleUserLeft.bind(this);

  }


  // =====================================================
  // EVENT SYSTEM
  // =====================================================

  on(
    event,
    handler
  ) {

    if (
      typeof handler !== "function"
    ) {

      return () => {};

    }


    if (
      !this.listeners.has(event)
    ) {

      this.listeners.set(
        event,
        new Set()
      );

    }


    const handlers =
      this.listeners.get(event);


    handlers.add(handler);


    return () => {

      handlers.delete(handler);

      if (
        handlers.size === 0
      ) {

        this.listeners.delete(event);

      }

    };

  }


  emit(
    event,
    payload = {}
  ) {

    const handlers =
      this.listeners.get(event);


    if (!handlers) {

      return;

    }


    handlers.forEach(
      handler => {

        try {

          handler(payload);

        } catch (error) {

          console.error(
            "[AgoraEngine] listener failed",
            {
              event,
              error
            }
          );

        }

      }
    );

  }


  // =====================================================
  // UID
  // =====================================================

  generateUid() {

    return Math.floor(
      Math.random() * 100000
    );

  }


  // =====================================================
  // TOKEN
  // =====================================================

  async getToken(
    channel,
    uid
  ) {

    console.log(
      "================================================="
    );

    console.log(
      "[Agora] TOKEN REQUEST IDENTITY"
    );

    console.log(
      "================================================="
    );

    console.log({
      channel,
      uid,
    });


    const api =
      process.env.REACT_APP_SERVER_API;


    if (!api) {

      throw new Error(
        "REACT_APP_SERVER_API is not configured"
      );

    }


    const url =
      `${api}/api/agora/token?channel=${encodeURIComponent(channel)}&uid=${uid}`;


    console.log(
      "[Agora] TOKEN REQUEST",
      {
        channel,
        uid
      }
    );


    const response =
      await fetch(url);


    if (!response.ok) {

      const text =
        await response.text();


      throw new Error(
        `Agora token request failed: ${response.status} ${text}`
      );

    }


    const text =
      await response.text();


    let data;


    try {

      data =
        JSON.parse(text);

    } catch (error) {

      throw new Error(
        "Agora token response was not valid JSON"
      );

    }


    if (!data.token) {

      throw new Error(
        "Agora token missing"
      );

    }


    return data.token;

  }


  // =====================================================
  // REMOTE USERS
  // =====================================================

  getRemoteUsers() {

    return new Map(
      this.remoteUsers
    );

  }

  getRemoteUsers() {

  return new Map(
    this.remoteUsers
  );

}


getRemoteUser(uid) {

  if (uid === undefined || uid === null) {
    return null;
  }

  return this.remoteUsers.get(uid) || null;

}


  // =====================================================
  // REMOTE USER SNAPSHOT
  //
  // IMPORTANT:
  //
  // This MUST contain plain serialisable data only.
  //
  // Never put:
  // - audioTrack
  // - videoTrack
  // - Agora User objects
  // - MediaStream objects
  //
  // into RuntimeState.
  // =====================================================

  getRemoteUsersSnapshot() {

    const snapshot = {};


    this.remoteUsers.forEach(
      (user, uid) => {

        snapshot[String(uid)] = {

          uid:
            user?.uid ?? uid,

          hasAudio:
            !!user?.audioTrack,

          hasVideo:
            !!user?.videoTrack,

        };

      }
    );


    return snapshot;

  }


  // =====================================================
  // REMOTE USER COUNT
  // =====================================================

  getRemoteUserCount() {

    return this.remoteUsers.size;

  }


  // =====================================================
  // REMOTE USER NOTIFICATION
  //
  // This is the ONLY method that publishes the remote
  // user collection into the runtime event system.
  // =====================================================

  notifyRemoteUsersChanged(
    source = "unknown"
  ) {

    const users =
      this.getRemoteUsersSnapshot();


    const count =
      Object.keys(users).length;


    console.log(
      "[AgoraEngine] REMOTE USERS NOTIFY",
      {
        source,

        mapSize:
          this.remoteUsers.size,

        count,

        users
      }
    );


    this.emit(
      "REMOTE_USERS_CHANGED",
      {
        users,
        count
      }
    );

  }


  // =====================================================
  // SUBSCRIBE TO REMOTE USER
  // =====================================================

  async subscribeToRemoteUser(
    user,
    mediaType
  ) {

    if (!user) {

      console.warn(
        "[AgoraEngine] subscribe ignored - missing user"
      );

      return false;

    }


    if (
      mediaType !== "audio" &&
      mediaType !== "video"
    ) {

      console.warn(
        "[AgoraEngine] unsupported media type",
        mediaType
      );

      return false;

    }


    try {

      console.log(
        "[AgoraEngine] subscribing",
        {
          uid:
            user.uid,

          mediaType
        }
      );


      // -------------------------------------------------
      // Subscribe
      // -------------------------------------------------

      await this.client.subscribe(
        user,
        mediaType
      );


      // -------------------------------------------------
      // Diagnostic BEFORE Map SET
      // -------------------------------------------------

      console.log(
        "[AgoraEngine] AFTER SUBSCRIBE BEFORE MAP SET",
        {
          uid:
            user.uid,

          mediaType,

          mapSize:
            this.remoteUsers.size
        }
      );


      // -------------------------------------------------
      // Store Agora user internally
      // -------------------------------------------------

      this.remoteUsers.set(
        user.uid,
        user
      );


      // -------------------------------------------------
      // Diagnostic AFTER Map SET
      // -------------------------------------------------

      console.log(
        "[AgoraEngine] AFTER MAP SET",
        {
          uid:
            user.uid,

          mediaType,

          mapSize:
            this.remoteUsers.size,

          users:
            this.getRemoteUsersSnapshot()
        }
      );


      // -------------------------------------------------
      // Remote audio
      // -------------------------------------------------

      if (
        mediaType === "audio" &&
        user.audioTrack
      ) {

        try {

          user.audioTrack.play();

        } catch (error) {

          console.error(
            "[AgoraEngine] remote audio playback failed",
            {
              uid:
                user.uid,

              error
            }
          );

        }

      }


      // -------------------------------------------------
      // Remote video
      //
      // AgoraFeed owns the DOM playback.
      // -------------------------------------------------

      if (
        mediaType === "video"
      ) {

        console.log(
          "[AgoraEngine] remote video track available",
          {
            uid:
              user.uid,

            hasVideoTrack:
              !!user.videoTrack
          }
        );

      }


      // -------------------------------------------------
      // Publish runtime-safe snapshot
      // -------------------------------------------------

      this.notifyRemoteUsersChanged(
        "after-subscribe"
      );


      return true;


    } catch (error) {

      console.error(
        "[AgoraEngine] remote subscribe failed",
        {
          uid:
            user?.uid,

          mediaType,

          error
        }
      );


      return false;

    }

  }


  // =====================================================
  // USER PUBLISHED
  // =====================================================

  async handleUserPublished(
    user,
    mediaType
  ) {

    console.log(
      "[AgoraEngine] USER PUBLISHED",
      {
        uid:
          user.uid,

        mediaType
      }
    );


    const subscribed =
      await this.subscribeToRemoteUser(
        user,
        mediaType
      );


    console.log(
      "[AgoraEngine] USER PUBLISHED SUBSCRIBE RESULT",
      {
        uid:
          user.uid,

        mediaType,

        subscribed,

        mapSize:
          this.remoteUsers.size
      }
    );


    this.emit(
      "USER_PUBLISHED",
      {
        uid:
          user.uid,

        mediaType
      }
    );

  }


  // =====================================================
  // USER UNPUBLISHED
  // =====================================================

  handleUserUnpublished(
    user,
    mediaType
  ) {

    console.log(
      "[AgoraEngine] USER UNPUBLISHED",
      {
        uid:
          user.uid,

        mediaType
      }
    );


    // Keep the user in the internal Map.
    // Agora removes the specific track from the user.
    this.remoteUsers.set(
      user.uid,
      user
    );


    this.notifyRemoteUsersChanged(
      "unpublished"
    );


    this.emit(
      "USER_UNPUBLISHED",
      {
        uid:
          user.uid,

        mediaType
      }
    );

  }


  // =====================================================
  // USER LEFT
  // =====================================================

  handleUserLeft(
    user
  ) {

    console.log(
      "[AgoraEngine] USER LEFT",
      {
        uid:
          user.uid
      }
    );


    this.remoteUsers.delete(
      user.uid
    );


    this.notifyRemoteUsersChanged(
      "user-left"
    );


    this.emit(
      "USER_LEFT",
      {
        uid:
          user.uid
      }
    );

  }


  // =====================================================
  // CLIENT EVENTS
  // =====================================================

  registerClientEvents() {

    this.unregisterClientEvents();


    this.client.on(
      "user-published",
      this.handleUserPublished
    );


    this.client.on(
      "user-unpublished",
      this.handleUserUnpublished
    );


    this.client.on(
      "user-left",
      this.handleUserLeft
    );


    console.log(
      "[AgoraEngine] client events registered"
    );

  }


  // =====================================================
  // REMOVE CLIENT EVENTS
  // =====================================================

  unregisterClientEvents() {

    this.client.off(
      "user-published",
      this.handleUserPublished
    );


    this.client.off(
      "user-unpublished",
      this.handleUserUnpublished
    );


    this.client.off(
      "user-left",
      this.handleUserLeft
    );

  }


  // =====================================================
  // PROCESS EXISTING USERS
  // =====================================================

  async processExistingRemoteUsers() {

    const users =
      this.client.remoteUsers || [];


    console.log(
      "[AgoraEngine] processing existing users",
      {
        count:
          users.length
      }
    );


    for (
      const user of users
    ) {

      console.log(
        "[AgoraEngine] existing remote user",
        {
          uid:
            user.uid,

          hasAudio:
            !!user.audioTrack,

          hasVideo:
            !!user.videoTrack
        }
      );


      // -------------------------------------------------
      // Store user immediately
      // -------------------------------------------------

      this.remoteUsers.set(
        user.uid,
        user
      );


      // -------------------------------------------------
      // Audio
      // -------------------------------------------------

      if (
        !user.audioTrack
      ) {

        try {

          await this.client.subscribe(
            user,
            "audio"
          );

        } catch (error) {

          console.log(
            "[AgoraEngine] existing audio not subscribed",
            {
              uid:
                user.uid
            }
          );

        }

      }


      // -------------------------------------------------
      // Video
      // -------------------------------------------------

      if (
        !user.videoTrack
      ) {

        try {

          await this.client.subscribe(
            user,
            "video"
          );

        } catch (error) {

          console.log(
            "[AgoraEngine] existing video not subscribed",
            {
              uid:
                user.uid
            }
          );

        }

      }


      // -------------------------------------------------
      // Existing audio playback
      // -------------------------------------------------

      if (
        user.audioTrack
      ) {

        try {

          user.audioTrack.play();

        } catch (error) {

          console.warn(
            "[AgoraEngine] existing audio playback failed",
            error
          );

        }

      }


      console.log(
        "[AgoraEngine] existing user processed",
        {
          uid:
            user.uid,

          mapSize:
            this.remoteUsers.size,

          users:
            this.getRemoteUsersSnapshot()
        }
      );

    }


    this.notifyRemoteUsersChanged(
      "existing-users"
    );

  }


  // =====================================================
  // JOIN CALL
  // =====================================================

  async joinCall({
    channel
  } = {}) {

    if (
      !this.appId ||
      !channel
    ) {

      console.warn(
        "[Agora] join blocked - missing params",
        {
          appId:
            !!this.appId,

          channel
        }
      );

      return false;

    }


    if (
      this.isJoining ||
      this.isLeaving ||
      this.isReady
    ) {

      console.warn(
        "[Agora] join ignored - lifecycle locked",
        {
          isJoining:
            this.isJoining,

          isLeaving:
            this.isLeaving,

          isReady:
            this.isReady
        }
      );

      return false;

    }


    this.isJoining =
      true;


    try {

      // -------------------------------------------------
      // Reset remote state
      // -------------------------------------------------

      this.remoteUsers.clear();


      this.notifyRemoteUsersChanged(
        "join-reset"
      );


      // -------------------------------------------------
      // Generate identity
      // -------------------------------------------------

      this.uid =
        this.generateUid();

      this.channel =
        channel;


      console.log(
        "================================================="
      );

      console.log(
        "[Agora] JOIN START IDENTITY"
      );

      console.log(
        "================================================="
      );

      console.log({
        appId:
          this.appId,

        channel:
          this.channel,

        uid:
          this.uid
      });


      this.emit(
        "JOIN_STARTED",
        {
          channel,

          uid:
            this.uid
        }
      );


      // -------------------------------------------------
      // Register events BEFORE joining
      // -------------------------------------------------

      this.registerClientEvents();


      // -------------------------------------------------
      // Token
      // -------------------------------------------------

      const token =
        await this.getToken(
          channel,
          this.uid
        );


      // -------------------------------------------------
      // Final identity
      // -------------------------------------------------

      console.log(
        "================================================="
      );

      console.log(
        "[Agora] FINAL JOIN IDENTITY"
      );

      console.log(
        "================================================="
      );

      console.log({
        appId:
          this.appId,

        channel,

        uid:
          this.uid,

        engineChannel:
          this.channel,

        connectionState:
          this.client.connectionState,

        tokenPresent:
          !!token
      });


      // -------------------------------------------------
      // Join Agora
      // -------------------------------------------------

      await this.client.join(
        this.appId,
        channel,
        token,
        this.uid
      );


      console.log(
        "[AgoraEngine] Agora client joined",
        {
          channel,

          uid:
            this.uid,

          connectionState:
            this.client.connectionState
        }
      );


      // -------------------------------------------------
      // Local audio
      // -------------------------------------------------

      this.localAudioTrack =
        await AgoraRTC
          .createMicrophoneAudioTrack();


      // -------------------------------------------------
      // Local video
      // -------------------------------------------------

      this.localVideoTrack =
        await AgoraRTC
          .createCameraVideoTrack();


      // -------------------------------------------------
      // Publish
      // -------------------------------------------------

      await this.client.publish([
        this.localAudioTrack,
        this.localVideoTrack
      ]);


      console.log(
        "[AgoraEngine] local tracks published",
        {
          uid:
            this.uid,

          channel
        }
      );


      this.isReady =
        true;


      // -------------------------------------------------
      // Local tracks ready
      // -------------------------------------------------

      this.emit(
        "LOCAL_TRACKS_READY",
        {
          audioTrack:
            this.localAudioTrack,

          videoTrack:
            this.localVideoTrack
        }
      );


      // -------------------------------------------------
      // Process existing users
      // -------------------------------------------------

      await this.processExistingRemoteUsers();


      // -------------------------------------------------
      // Joined
      // -------------------------------------------------

      this.emit(
        "CALL_JOINED",
        {
          channel,

          uid:
            this.uid
        }
      );


      console.log(
        "[Agora] joined successfully",
        {
          channel,

          uid:
            this.uid
        }
      );


      return true;


    } catch (error) {

      console.error(
        "[Agora] join failed",
        error
      );


      this.emit(
        "CALL_JOIN_FAILED",
        {
          error
        }
      );


      await this.cleanup();


      return false;


    } finally {

      this.isJoining =
        false;

    }

  }


  // =====================================================
  // LEAVE CALL
  // =====================================================

  async leaveCall() {

    if (
      this.isLeaving
    ) {

      console.warn(
        "[Agora] leave ignored - already leaving"
      );

      return false;

    }


    if (
      !this.isReady &&
      this.client.connectionState ===
        "DISCONNECTED"
    ) {

      return true;

    }


    this.isLeaving =
      true;


    try {

      this.emit(
        "LEAVE_STARTED",
        {}
      );


      // -------------------------------------------------
      // Stop local audio
      // -------------------------------------------------

      if (
        this.localAudioTrack
      ) {

        this.localAudioTrack.stop();

        this.localAudioTrack.close();

        this.localAudioTrack =
          null;

      }


      // -------------------------------------------------
      // Stop local video
      // -------------------------------------------------

      if (
        this.localVideoTrack
      ) {

        this.localVideoTrack.stop();

        this.localVideoTrack.close();

        this.localVideoTrack =
          null;

      }


      // -------------------------------------------------
      // Leave Agora
      // -------------------------------------------------

      if (
        this.client.connectionState !==
        "DISCONNECTED"
      ) {

        await this.client.leave();

      }


      // -------------------------------------------------
      // Remove listeners
      // -------------------------------------------------

      this.unregisterClientEvents();


      // -------------------------------------------------
      // Reset remote users
      // -------------------------------------------------

      this.remoteUsers.clear();


      this.notifyRemoteUsersChanged(
        "leave-reset"
      );


      // -------------------------------------------------
      // Save previous identity
      // -------------------------------------------------

      const previousUid =
        this.uid;

      const previousChannel =
        this.channel;


      // -------------------------------------------------
      // Reset identity
      // -------------------------------------------------

      this.uid =
        null;

      this.channel =
        null;

      this.isReady =
        false;


      this.emit(
        "CALL_LEFT",
        {
          uid:
            previousUid,

          channel:
            previousChannel
        }
      );


      console.log(
        "[Agora] left successfully",
        {
          uid:
            previousUid,

          channel:
            previousChannel
        }
      );


      return true;


    } catch (error) {

      console.error(
        "[Agora] leave failed",
        error
      );


      return false;


    } finally {

      this.isLeaving =
        false;

    }

  }


  // =====================================================
  // CLEANUP
  // =====================================================

  async cleanup() {

    console.log(
      "[AgoraEngine] cleanup"
    );


    try {

      if (
        this.localAudioTrack
      ) {

        this.localAudioTrack.stop();

        this.localAudioTrack.close();

        this.localAudioTrack =
          null;

      }


      if (
        this.localVideoTrack
      ) {

        this.localVideoTrack.stop();

        this.localVideoTrack.close();

        this.localVideoTrack =
          null;

      }


      if (
        this.client.connectionState !==
        "DISCONNECTED"
      ) {

        await this.client.leave();

      }


      this.unregisterClientEvents();


      this.remoteUsers.clear();


    } catch (error) {

      console.warn(
        "[Agora] cleanup warning",
        error
      );

    }


    this.uid =
      null;

    this.channel =
      null;

    this.isReady =
      false;

    this.isJoining =
      false;

    this.micLock =
      false;

    this.videoLock =
      false;


    this.notifyRemoteUsersChanged(
      "cleanup"
    );

  }


  // =====================================================
  // TOGGLE MIC
  // =====================================================

  async toggleMic() {

    if (
      !this.isReady ||
      !this.localAudioTrack
    ) {

      console.warn(
        "[Agora] mic unavailable"
      );

      return false;

    }


    if (
      this.micLock
    ) {

      return false;

    }


    this.micLock =
      true;


    try {

      const enabled =
        !this.localAudioTrack.enabled;


      await this.localAudioTrack.setEnabled(
        enabled
      );


      this.emit(
        "MIC_TOGGLED",
        {
          enabled
        }
      );


      return enabled;


    } catch (error) {

      console.error(
        "[Agora] mic toggle failed",
        error
      );


      return false;


    } finally {

      this.micLock =
        false;

    }

  }


  // =====================================================
  // TOGGLE VIDEO
  // =====================================================

  async toggleVideo() {

    if (
      !this.isReady ||
      !this.localVideoTrack
    ) {

      console.warn(
        "[Agora] video unavailable"
      );

      return false;

    }


    if (
      this.videoLock
    ) {

      return false;

    }


    this.videoLock =
      true;


    try {

      const enabled =
        !this.localVideoTrack.enabled;


      await this.localVideoTrack.setEnabled(
        enabled
      );


      this.emit(
        "VIDEO_TOGGLED",
        {
          enabled
        }
      );


      return enabled;


    } catch (error) {

      console.error(
        "[Agora] video toggle failed",
        error
      );


      return false;


    } finally {

      this.videoLock =
        false;

    }

  }


  // =====================================================
  // LOCAL VIDEO
  // =====================================================

  getLocalVideoTrack() {

    return this.localVideoTrack;

  }

}


export default new AgoraEngine();