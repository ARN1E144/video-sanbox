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
    // CURRENT IDENTITY
    // =====================================================

    this.uid =
      null;

    this.channel =
      null;


    // =====================================================
    // LOCAL TRACKS
    // =====================================================

    this.localAudioTrack =
      null;

    this.localVideoTrack =
      null;


    // =====================================================
    // REMOTE USERS
    //
    // IMPORTANT:
    //
    // This Map contains live Agora objects.
    //
    // It is INTERNAL ENGINE STATE ONLY.
    //
    // RuntimeState must only receive the serialisable
    // snapshot produced by getRemoteUsersSnapshot().
    //
    // IMPORTANT INVARIANT:
    //
    // Map keys are ALWAYS normalised strings.
    //
    // =====================================================

    this.remoteUsers =
      new Map();


    // =====================================================
    // REMOTE USER IDENTITY
    //
    // Agora UID -> application user identity.
    //
    // Example:
    //
    // "23176" -> {
    //   userId: "...",
    //   firstName: "Anish",
    //   lastName: "Nish",
    //   email: "...",
    //   displayName: "Anish Nish"
    // }
    //
    // =====================================================

    this.remoteIdentities =
      new Map();


    // =====================================================
    // ENGINE STATE
    // =====================================================

    this.isReady =
      false;

    this.isJoining =
      false;

    this.isLeaving =
      false;


    // =====================================================
    // ACTION LOCKS
    // =====================================================

    this.micLock =
      false;

    this.videoLock =
      false;


    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    this.listeners =
      new Map();


    // =====================================================
    // CLIENT EVENT HANDLERS
    // =====================================================

    this.handleUserPublished =
      this.handleUserPublished.bind(
        this
      );

    this.handleUserUnpublished =
      this.handleUserUnpublished.bind(
        this
      );

    this.handleUserLeft =
      this.handleUserLeft.bind(
        this
      );

  }


  // =====================================================
  // UID NORMALISATION
  // =====================================================

  normaliseUid(
    uid
  ) {

    if (
      uid === null ||
      uid === undefined
    ) {

      return null;

    }


    const value =
      String(
        uid
      ).trim();


    return value ||
      null;

  }


  // =====================================================
  // EVENT SYSTEM
  // =====================================================

  on(
    event,
    handler
  ) {

    if (
      typeof handler !==
      "function"
    ) {

      return () => {};

    }


    if (
      !this.listeners.has(
        event
      )
    ) {

      this.listeners.set(
        event,
        new Set()
      );

    }


    const handlers =
      this.listeners.get(
        event
      );


    handlers.add(
      handler
    );


    return () => {

      handlers.delete(
        handler
      );


      if (
        handlers.size === 0
      ) {

        this.listeners.delete(
          event
        );

      }

    };

  }


  emit(
    event,
    payload = {}
  ) {

    const handlers =
      this.listeners.get(
        event
      );


    if (
      !handlers
    ) {

      return;

    }


    handlers.forEach(
      handler => {

        try {

          handler(
            payload
          );

        }
        catch (
          error
        ) {

          console.error(
            "[AgoraEngine] listener failed",
            {
              event,
              error,
            }
          );

        }

      }
    );

  }


  // =====================================================
  // UID GENERATION
  // =====================================================

  generateUid() {

    return Math.floor(
      Math.random() *
      100000
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


    if (
      !api
    ) {

      throw new Error(
        "REACT_APP_SERVER_API is not configured"
      );

    }


    const url =
      `${api}/api/agora/token?channel=${encodeURIComponent(
        channel
      )}&uid=${encodeURIComponent(
        uid
      )}`;


    console.log(
      "[Agora] TOKEN REQUEST",
      {
        channel,
        uid,
      }
    );


    const response =
      await fetch(
        url
      );


    if (
      !response.ok
    ) {

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
        JSON.parse(
          text
        );

    }
    catch (
      error
    ) {

      throw new Error(
        "Agora token response was not valid JSON"
      );

    }


    if (
      !data?.token
    ) {

      throw new Error(
        "Agora token missing"
      );

    }


    return data.token;

  }


  // =====================================================
  // REMOTE USER ACCESS
  // =====================================================

  getRemoteUsers() {

    return new Map(
      this.remoteUsers
    );

  }


  getRemoteUser(
    uid
  ) {

    const key =
      this.normaliseUid(
        uid
      );


    if (
      !key
    ) {

      return null;

    }


    return (
      this.remoteUsers.get(
        key
      ) ||
      null
    );

  }


  // =====================================================
  // REMOTE USER SNAPSHOT
  //
  // NEVER expose Agora objects here.
  // =====================================================

  getRemoteUsersSnapshot() {

    const snapshot =
      {};


    this.remoteUsers.forEach(
      (
        user,
        uid
      ) => {

        const identity =
          this.getRemoteUserIdentity(
            uid
          );


        snapshot[
          String(
            uid
          )
        ] = {

          uid:
            this.normaliseUid(
              user?.uid ??
              uid
            ),

          userId:
            identity?.userId ??
            null,

          firstName:
            identity?.firstName ??
            "",

          lastName:
            identity?.lastName ??
            "",

          email:
            identity?.email ??
            "",

          displayName:
            identity?.displayName ??
            "Participant",

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
  // =====================================================

  notifyRemoteUsersChanged(
    source = "unknown"
  ) {

    const users =
      this.getRemoteUsersSnapshot();


    const count =
      Object.keys(
        users
      ).length;


    console.log(
      "[AgoraEngine] REMOTE USERS NOTIFY",
      {
        source,

        mapSize:
          this.remoteUsers.size,

        count,

        users,
      }
    );


    this.emit(
      "REMOTE_USERS_CHANGED",
      {
        users,

        count,

        source,
      }
    );

  }


  // =====================================================
  // REMOTE USER IDENTITY
  // =====================================================

  setRemoteUserIdentity(
    uid,
    identity = {}
  ) {

    const key =
      this.normaliseUid(
        uid
      );


    if (
      !key
    ) {

      return;

    }


    const firstName =
      String(
        identity?.firstName ||
        ""
      ).trim();


    const lastName =
      String(
        identity?.lastName ||
        ""
      ).trim();


    const displayName =
      String(
        identity?.displayName ||
        [firstName, lastName]
          .filter(Boolean)
          .join(" ") ||
        identity?.name ||
        identity?.email ||
        "Participant"
      ).trim();


    this.remoteIdentities.set(
      key,
      {

        userId:
          identity?.userId
            ? String(
                identity.userId
              )
            : null,

        firstName,

        lastName,

        email:
          identity?.email
            ? String(
                identity.email
              )
            : "",

        displayName:
          displayName ||
          "Participant",

      }
    );


    this.notifyRemoteUsersChanged(
      "identity-updated"
    );

  }


  clearRemoteUserIdentity(
    uid
  ) {

    const key =
      this.normaliseUid(
        uid
      );


    if (
      !key
    ) {

      return;

    }


    this.remoteIdentities.delete(
      key
    );

  }


  clearAllRemoteIdentities() {

    this.remoteIdentities.clear();

  }


  getRemoteUserIdentity(
    uid
  ) {

    const key =
      this.normaliseUid(
        uid
      );


    if (
      !key
    ) {

      return null;

    }


    return (
      this.remoteIdentities.get(
        key
      ) ||
      null
    );

  }


  // =====================================================
  // REMOTE VIDEO READY
  // =====================================================

  notifyRemoteVideoReady(
    user
  ) {

    const uid =
      this.normaliseUid(
        user?.uid
      );


    const videoTrack =
      user?.videoTrack;


    if (
      !uid ||
      !videoTrack
    ) {

      return;

    }


    console.log(
      "[AgoraEngine] REMOTE VIDEO TRACK READY",
      {

        uid,

        track:
          videoTrack,

        readyState:
          videoTrack
            ?.mediaStreamTrack
            ?.readyState,

      }
    );


    this.emit(
      "REMOTE_VIDEO_TRACK_READY",
      {

        uid,

        user,

        videoTrack,

      }
    );

  }


  // =====================================================
  // REMOTE VIDEO UNAVAILABLE
  // =====================================================

  notifyRemoteVideoUnavailable(
    user
  ) {

    const uid =
      this.normaliseUid(
        user?.uid
      );


    if (
      !uid
    ) {

      return;

    }


    console.log(
      "[AgoraEngine] REMOTE VIDEO TRACK UNAVAILABLE",
      {
        uid,
      }
    );


    this.emit(
      "REMOTE_VIDEO_TRACK_UNAVAILABLE",
      {
        uid,
      }
    );

  }


  // =====================================================
  // STORE REMOTE USER
  // =====================================================

  storeRemoteUser(
    user
  ) {

    const uid =
      this.normaliseUid(
        user?.uid
      );


    if (
      !uid ||
      !user
    ) {

      return null;

    }


    this.remoteUsers.set(
      uid,
      user
    );


    return uid;

  }


  // =====================================================
  // SUBSCRIBE TO REMOTE USER
  //
  // This is now the single authoritative subscription
  // path for both:
  //
  // - user-published
  // - existing users discovered after join
  //
  // =====================================================

  async subscribeToRemoteUser(
    user,
    mediaType
  ) {

    if (
      !user
    ) {

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


    const uid =
      this.normaliseUid(
        user?.uid
      );


    if (
      !uid
    ) {

      console.warn(
        "[AgoraEngine] subscribe ignored - missing UID"
      );

      return false;

    }


    try {

      console.log(
        "[AgoraEngine] subscribing",
        {
          uid,
          mediaType,
        }
      );


      // -------------------------------------------------
      // Agora subscription
      // -------------------------------------------------

      await this.client.subscribe(
        user,
        mediaType
      );


      // -------------------------------------------------
      // Store normalised live user
      // -------------------------------------------------

      this.storeRemoteUser(
        user
      );


      console.log(
        "[AgoraEngine] subscription complete",
        {

          uid,

          mediaType,

          hasAudio:
            !!user.audioTrack,

          hasVideo:
            !!user.videoTrack,

        }
      );


      // -------------------------------------------------
      // AUDIO
      // -------------------------------------------------

      if (
        mediaType === "audio" &&
        user.audioTrack
      ) {

        try {

          user.audioTrack.play();

        }
        catch (
          error
        ) {

          console.warn(
            "[AgoraEngine] remote audio playback failed",
            {
              uid,
              error,
            }
          );

        }

      }


      // -------------------------------------------------
      // VIDEO
      // -------------------------------------------------

      if (
        mediaType === "video"
      ) {

        if (
          user.videoTrack
        ) {

          this.notifyRemoteVideoReady(
            user
          );

        }
        else {

          this.notifyRemoteVideoUnavailable(
            user
          );

        }

      }


      // -------------------------------------------------
      // Publish runtime-safe state
      // -------------------------------------------------

      this.notifyRemoteUsersChanged(
        `after-${mediaType}-subscribe`
      );


      return true;

    }
    catch (
      error
    ) {

      console.error(
        "[AgoraEngine] remote subscribe failed",
        {

          uid,

          mediaType,

          error,

        }
      );


      if (
        mediaType === "video"
      ) {

        this.notifyRemoteVideoUnavailable(
          user
        );

      }


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

    const uid =
      this.normaliseUid(
        user?.uid
      );


    console.log(
      "[AgoraEngine] USER PUBLISHED",
      {

        uid,

        mediaType,

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

        uid,

        mediaType,

        subscribed,

        mapSize:
          this.remoteUsers.size,

      }
    );


    this.emit(
      "USER_PUBLISHED",
      {

        uid,

        mediaType,

        subscribed,

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

    const uid =
      this.normaliseUid(
        user?.uid
      );


    console.log(
      "[AgoraEngine] USER UNPUBLISHED",
      {

        uid,

        mediaType,

      }
    );


    if (
      !uid
    ) {

      return;

    }


    // Keep the live user reference.
    //
    // Agora updates the user object by removing the
    // unpublished track.

    this.remoteUsers.set(
      uid,
      user
    );


    // -------------------------------------------------
    // Runtime snapshot
    // -------------------------------------------------

    this.notifyRemoteUsersChanged(
      "unpublished"
    );


    // -------------------------------------------------
    // Consumer event
    // -------------------------------------------------

    this.emit(
      "USER_UNPUBLISHED",
      {

        uid,

        mediaType,

      }
    );


    // -------------------------------------------------
    // Video unavailable
    // -------------------------------------------------

    if (
      mediaType === "video"
    ) {

      this.notifyRemoteVideoUnavailable(
        user
      );

    }

  }


  // =====================================================
  // USER LEFT
  // =====================================================

  handleUserLeft(
    user
  ) {

    const uid =
      this.normaliseUid(
        user?.uid
      );


    console.log(
      "[AgoraEngine] USER LEFT",
      {
        uid,
      }
    );


    if (
      !uid
    ) {

      return;

    }


    this.remoteUsers.delete(
      uid
    );


    this.clearRemoteUserIdentity(
      uid
    );


    this.notifyRemoteUsersChanged(
      "user-left"
    );


    this.emit(
      "USER_LEFT",
      {
        uid,
      }
    );

  }


  // =====================================================
  // CLIENT EVENT REGISTRATION
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
  // CLIENT EVENT REMOVAL
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
  //
  // Uses the SAME subscription path as new users.
  //
  // This removes the old duplicate subscription logic.
  //
  // =====================================================

  async processExistingRemoteUsers() {

    const users =
      this.client.remoteUsers ||
      [];


    console.log(
      "[AgoraEngine] processing existing users",
      {
        count:
          users.length,
      }
    );


    for (
      const user of users
    ) {

      const uid =
        this.normaliseUid(
          user?.uid
        );


      if (
        !uid
      ) {

        continue;

      }


      console.log(
        "[AgoraEngine] existing remote user",
        {

          uid,

          hasAudio:
            !!user.audioTrack,

          hasVideo:
            !!user.videoTrack,

        }
      );


      // -------------------------------------------------
      // Store immediately
      // -------------------------------------------------

      this.storeRemoteUser(
        user
      );


      // -------------------------------------------------
      // Existing audio
      // -------------------------------------------------

      if (
        user.audioTrack
      ) {

        try {

          user.audioTrack.play();

        }
        catch (
          error
        ) {

          console.warn(
            "[AgoraEngine] existing audio playback failed",
            {
              uid,
              error,
            }
          );

        }

      }
      else {

        // Subscribe using the common path.
        await this.subscribeToRemoteUser(
          user,
          "audio"
        );

      }


      // -------------------------------------------------
      // Existing video
      // -------------------------------------------------

      if (
        user.videoTrack
      ) {

        // Track already exists.
        //
        // Announce it directly.

        this.notifyRemoteVideoReady(
          user
        );

      }
      else {

        // Ask Agora to subscribe.
        //
        // The common path emits REMOTE_VIDEO_TRACK_READY
        // after the track becomes available.

        await this.subscribeToRemoteUser(
          user,
          "video"
        );

      }


      console.log(
        "[AgoraEngine] existing user processed",
        {

          uid,

          mapSize:
            this.remoteUsers.size,

          users:
            this.getRemoteUsersSnapshot(),

        }
      );

    }


    // ---------------------------------------------------
    // Final runtime snapshot
    // ---------------------------------------------------

    this.notifyRemoteUsersChanged(
      "existing-users"
    );

  }


// =====================================================
// JOIN CALL
// =====================================================

async joinCall({
  channel,
  uid: requestedUid = null,
} = {}) {

  // ===================================================
  // VALIDATION
  // ===================================================

  if (
    !this.appId ||
    !channel
  ) {

    console.warn(
      "[Agora] join blocked - missing params",
      {

        appId:
          !!this.appId,

        channel,

      }
    );


    return false;

  }


  // ===================================================
  // LIFECYCLE LOCK
  // ===================================================

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
          this.isReady,

      }
    );


    return false;

  }


  this.isJoining =
    true;


  try {

    // =================================================
    // RESOLVE UID
    // =================================================
    //
    // Group calls pass an explicit UID.
    //
    // Standard calls may omit it and the engine will
    // generate one as before.
    //
    // =================================================

    const normalisedRequestedUid =
      requestedUid !== null &&
      requestedUid !== undefined &&
      String(
        requestedUid
      ).trim() !== ""

        ? String(
            requestedUid
          ).trim()

        : null;


    const joinUid =
      normalisedRequestedUid ||
      String(
        this.generateUid()
      );


    // =================================================
    // SET ENGINE IDENTITY
    // =================================================

    this.uid =
      joinUid;


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

    console.log(
      {

        appId:
          this.appId,

        channel:
          this.channel,

        requestedUid:
          normalisedRequestedUid,

        joinUid:
          this.uid,

        uidWasProvided:
          !!normalisedRequestedUid,

      }
    );


    // =================================================
    // RESET REMOTE USERS
    // =================================================

    this.remoteUsers.clear();


    // =================================================
    // CLEAR OLD REMOTE IDENTITIES
    // =================================================

    if (
      typeof this.clearAllRemoteIdentities ===
      "function"
    ) {

      this.clearAllRemoteIdentities();

    }
    else {

      this.remoteIdentities.clear();

    }


    this.notifyRemoteUsersChanged(
      "join-reset"
    );


    // =================================================
    // JOIN STARTED
    // =================================================

    this.emit(
      "JOIN_STARTED",
      {

        channel,

        uid:
          this.uid,

      }
    );


    // =================================================
    // REGISTER CLIENT EVENTS BEFORE JOIN
    // =================================================

    this.registerClientEvents();


    // =================================================
    // TOKEN
    // =================================================

    const token =
      await this.getToken(
        channel,
        this.uid
      );


    // =================================================
    // FINAL JOIN IDENTITY
    // =================================================

    console.log(
      "================================================="
    );

    console.log(
      "[Agora] FINAL JOIN IDENTITY"
    );

    console.log(
      "================================================="
    );

    console.log(
      {

        appId:
          this.appId,

        channel,

        requestedUid:
          normalisedRequestedUid,

        joinUid:
          this.uid,

        engineChannel:
          this.channel,

        connectionState:
          this.client.connectionState,

        tokenPresent:
          !!token,

      }
    );


    // =================================================
    // JOIN AGORA
    // =================================================
    //
    // IMPORTANT:
    //
    // We pass this.uid directly to Agora.
    //
    // No second UID is generated here.
    //
    // =================================================

    const joinedUid =
      await this.client.join(
        this.appId,
        channel,
        token,
        this.uid
      );


    // =================================================
    // RESOLVE ACTUAL AGORA UID
    // =================================================

    const actualAgoraUid =
      joinedUid !== null &&
      joinedUid !== undefined

        ? String(
            joinedUid
          )

        : (
            this.client.uid !== null &&
            this.client.uid !== undefined

              ? String(
                  this.client.uid
                )

              : String(
                  this.uid
                )
          );


    // =================================================
    // UID VERIFICATION
    // =================================================

    console.log(
      "[AgoraEngine] JOIN UID VERIFICATION",
      {

        requestedUid:
          normalisedRequestedUid,

        joinUid:
          joinUid,

        joinedUid:
          actualAgoraUid,

        clientUid:
          this.client.uid,

        engineUid:
          this.uid,

        connectionState:
          this.client.connectionState,

      }
    );


    // =================================================
    // UID DIFFERENCE DIAGNOSTIC
    // =================================================
    //
    // Do not kill the working call yet.
    //
    // If Agora/browser reports a different value we log
    // it, but continue so we can observe the rest of the
    // media lifecycle.
    //
    // =================================================

    if (
      normalisedRequestedUid &&
      actualAgoraUid !==
        normalisedRequestedUid
    ) {

      console.warn(
        "[AgoraEngine] UID DIFFERENCE DETECTED",
        {

          requestedUid:
            normalisedRequestedUid,

          actualAgoraUid,

          clientUid:
            this.client.uid,

          channel,

        }
      );

    }


    // =================================================
    // STORE ACTUAL AGORA UID
    // =================================================

    this.uid =
      actualAgoraUid;


    // =================================================
    // AGORA JOINED
    // =================================================

    console.log(
      "[AgoraEngine] Agora client joined",
      {

        channel,

        uid:
          this.uid,

        connectionState:
          this.client.connectionState,

      }
    );


    // =================================================
    // LOCAL AUDIO
    // =================================================

    this.localAudioTrack =
      await AgoraRTC
        .createMicrophoneAudioTrack();


    // =================================================
    // LOCAL VIDEO
    // =================================================

    this.localVideoTrack =
      await AgoraRTC
        .createCameraVideoTrack();


    // =================================================
    // PUBLISH
    // =================================================

    await this.client.publish(
      [
        this.localAudioTrack,
        this.localVideoTrack,
      ]
    );


    console.log(
      "[AgoraEngine] local tracks published",
      {

        uid:
          this.uid,

        channel,

      }
    );


    // =================================================
    // ENGINE READY
    // =================================================

    this.isReady =
      true;


    // =================================================
    // LOCAL TRACKS READY
    // =================================================

    this.emit(
      "LOCAL_TRACKS_READY",
      {

        audioTrack:
          this.localAudioTrack,

        videoTrack:
          this.localVideoTrack,

        uid:
          this.uid,

        channel,

      }
    );


    // =================================================
    // PROCESS USERS ALREADY IN CHANNEL
    // =================================================

    await this.processExistingRemoteUsers();


    // =================================================
    // CALL JOINED
    // =================================================

    this.emit(
      "CALL_JOINED",
      {

        channel,

        uid:
          this.uid,

      }
    );


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "[Agora] joined successfully",
      {

        channel,

        uid:
          this.uid,

        remoteUserCount:
          this.remoteUsers.size,

      }
    );


    return true;

  }
  catch (
    error
  ) {

    console.error(
      "[Agora] join failed",
      error
    );


    this.emit(
      "CALL_JOIN_FAILED",
      {
        error,
      }
    );


    await this.cleanup();


    return false;

  }
  finally {

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


      // =================================================
      // STOP LOCAL AUDIO
      // =================================================

      if (
        this.localAudioTrack
      ) {

        this.localAudioTrack.stop();

        this.localAudioTrack.close();

        this.localAudioTrack =
          null;

      }


      // =================================================
      // STOP LOCAL VIDEO
      // =================================================

      if (
        this.localVideoTrack
      ) {

        this.localVideoTrack.stop();

        this.localVideoTrack.close();

        this.localVideoTrack =
          null;

      }


      // =================================================
      // LEAVE AGORA
      // =================================================

      if (
        this.client.connectionState !==
        "DISCONNECTED"
      ) {

        await this.client.leave();

      }


      // =================================================
      // REMOVE CLIENT EVENTS
      // =================================================

      this.unregisterClientEvents();


      // =================================================
      // CLEAR REMOTE STATE
      // =================================================

      this.remoteUsers.clear();

      this.clearAllRemoteIdentities();


      this.notifyRemoteUsersChanged(
        "leave-reset"
      );


      // =================================================
      // SAVE PREVIOUS IDENTITY
      // =================================================

      const previousUid =
        this.uid;


      const previousChannel =
        this.channel;


      // =================================================
      // RESET IDENTITY
      // =================================================

      this.uid =
        null;

      this.channel =
        null;

      this.isReady =
        false;


      // =================================================
      // CALL LEFT
      // =================================================

      this.emit(
        "CALL_LEFT",
        {

          uid:
            previousUid,

          channel:
            previousChannel,

        }
      );


      console.log(
        "[Agora] left successfully",
        {

          uid:
            previousUid,

          channel:
            previousChannel,

        }
      );


      return true;

    }
    catch (
      error
    ) {

      console.error(
        "[Agora] leave failed",
        error
      );


      return false;

    }
    finally {

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

      // -------------------------------------------------
      // LOCAL AUDIO
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
      // LOCAL VIDEO
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
      // LEAVE AGORA
      // -------------------------------------------------

      if (
        this.client.connectionState !==
        "DISCONNECTED"
      ) {

        await this.client.leave();

      }


      // -------------------------------------------------
      // REMOVE CLIENT EVENTS
      // -------------------------------------------------

      this.unregisterClientEvents();


      // -------------------------------------------------
      // CLEAR REMOTE STATE
      // -------------------------------------------------

      this.remoteUsers.clear();

      this.clearAllRemoteIdentities();

    }
    catch (
      error
    ) {

      console.warn(
        "[Agora] cleanup warning",
        error
      );

    }


    // ===================================================
    // RESET FLAGS
    // ===================================================

    this.uid =
      null;

    this.channel =
      null;

    this.isReady =
      false;

    this.isJoining =
      false;

    this.isLeaving =
      false;

    this.micLock =
      false;

    this.videoLock =
      false;


    // ===================================================
    // NOTIFY CONSUMERS
    // ===================================================

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
          enabled,
        }
      );


      return enabled;

    }
    catch (
      error
    ) {

      console.error(
        "[Agora] mic toggle failed",
        error
      );


      return false;

    }
    finally {

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
          enabled,
        }
      );


      return enabled;

    }
    catch (
      error
    ) {

      console.error(
        "[Agora] video toggle failed",
        error
      );


      return false;

    }
    finally {

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


// =======================================================
// SINGLETON
// =======================================================

export default new AgoraEngine();