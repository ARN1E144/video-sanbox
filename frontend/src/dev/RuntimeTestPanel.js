// src/dev/RuntimeTestPanel.js

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRuntimeState,
} from "../context/RuntimeStateContext";

import {
  useActionContext,
} from "../context/ActionContext";

import {
  useProjectContext,
} from "../context/ProjectContext";

import RuntimeStatusPanel
  from "./panels/RuntimeStatusPanel";

import CallControlsPanel
  from "./panels/CallControlsPanel";

import InterviewControlsPanel
  from "./panels/InterviewControlsPanel";


// =====================================================
// FIND PROJECT ELEMENT BY SOURCE ID
// =====================================================

function findElementBySourceId(
  node,
  sourceId
) {

  if (
    !node ||
    typeof node !== "object"
  ) {

    return null;

  }


  if (
    node?.meta?.sourceId ===
    sourceId
  ) {

    return node;

  }


  if (
    node?.props?.meta?.sourceId ===
    sourceId
  ) {

    return node;

  }


  if (
    Array.isArray(
      node.children
    )
  ) {

    for (
      const child of node.children
    ) {

      const match =
        findElementBySourceId(
          child,
          sourceId
        );


      if (
        match
      ) {

        return match;

      }

    }

  }


  return null;

}


// =====================================================
// URL HELPERS
// =====================================================

function looksLikeYouTube(
  value
) {

  return (
    typeof value ===
      "string" &&
    (
      value.includes(
        "youtube.com"
      ) ||
      value.includes(
        "youtu.be"
      )
    )
  );

}


function detectMediaType(
  value
) {

  if (
    !value ||
    typeof value !==
      "string"
  ) {

    return "unknown";

  }


  if (
    looksLikeYouTube(
      value
    )
  ) {

    return "youtube";

  }


  const clean =
    value
      .split("?")[0]
      .toLowerCase();


  if (
    clean.endsWith(
      ".m3u8"
    )
  ) {

    return "hls";

  }


  if (
    clean.endsWith(
      ".mp4"
    ) ||
    clean.endsWith(
      ".webm"
    ) ||
    clean.endsWith(
      ".ogg"
    ) ||
    clean.endsWith(
      ".mov"
    )
  ) {

    return "video";

  }


  if (
    clean.match(
      /\.(jpg|jpeg|png|gif|webp|svg)$/
    )
  ) {

    return "image";

  }


  if (
    clean.endsWith(
      ".pdf"
    )
  ) {

    return "pdf";

  }


  return "url";

}


// =====================================================
// DEFAULT TEST SOURCES
// =====================================================

const DEFAULT_VIDEO_SOURCE =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4";


const DEFAULT_YOUTUBE_SOURCE =
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ";


const DEFAULT_PDF_SOURCE =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";


// =====================================================
// COMPONENT
// =====================================================

export default function RuntimeTestPanel() {

  // ===================================================
  // CONTEXT
  // ===================================================

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
    useActionContext();


  const {
    projectSchema,
    activeProject,
  } =
    useProjectContext();


  // ===================================================
  // PROJECT RUNTIME
  // ===================================================

  const runtimeProject =
    runtime.get?.(
      "project"
    );


  const runtimeProjectId =
    runtime.get?.(
      "project.id"
    );


  // ===================================================
  // RESPONSIVE STATE
  // ===================================================

  const [
    isMobile,
    setIsMobile,
  ] =
  useState(
    window.innerWidth <= 600
  );


  const [
    isOpen,
    setIsOpen,
  ] =
  useState(
    true
  );


  // ===================================================
  // POSITION
  // ===================================================

  const [
    position,
    setPosition,
  ] =
  useState({

    x:
      window.innerWidth > 600
        ? Math.max(
            20,
            window.innerWidth - 440
          )
        : 12,

    y:
      80,

  });


  // ===================================================
  // TRAINING PARTICIPANTS
  // ===================================================

  const [
    trainingParticipantIds,
    setTrainingParticipantIds,
  ] =
  useState(
    () =>
      runtime.get?.(
        "training.participantIds"
      ) || []
  );


  // ===================================================
  // GROUP CALL TEST INPUT
  // ===================================================

  const [
    groupParticipantInput,
    setGroupParticipantInput,
  ] =
  useState("");


  const [
    groupCallIdInput,
    setGroupCallIdInput,
  ] =
  useState("");


  const [
    selectedGroupInvitationIndex,
    setSelectedGroupInvitationIndex,
  ] =
  useState(0);


  const [
    groupActionRunning,
    setGroupActionRunning,
  ] =
  useState(false);


  // ===================================================
  // GROUP CALL RUNTIME STATE
  //
  // IMPORTANT:
  //
  // These values are React state so the Runtime Test
  // Panel re-renders whenever the runtime changes.
  //
  // ===================================================

  const [
    pendingGroupInvitations,
    setPendingGroupInvitations,
  ] =
  useState(
    () => {

      const value =
        runtime.get?.(
          "calls.pendingInvitations"
        );


      return Array.isArray(value)
        ? value
        : [];

    }
  );


  const [
    runtimeGroupCallId,
    setRuntimeGroupCallId,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.id"
      ) || ""
  );


  const [
    groupCallChannel,
    setGroupCallChannel,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.channel"
      ) || ""
  );


  const [
    groupCallState,
    setGroupCallState,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.state"
      ) || "idle"
  );


  const [
    groupCallJoined,
    setGroupCallJoined,
  ] =
  useState(
    () =>
      Boolean(
        runtime.get?.(
          "call.joined"
        )
      )
  );


  // =====================================================
// GROUP CALL PARTICIPANT COUNT
// =====================================================
//
// call.participants is now normally an array of participant
// objects rather than a numeric count.
//
// Keep the panel state as a number so the existing UI can
// continue displaying:
// 
//   Participants: 3
//
// Supports both the new array format and the old numeric
// format for backwards compatibility.
//
// =====================================================

const [
  groupCallParticipantCount,
  setGroupCallParticipantCount,
] =
useState(
  () => {

    const initialParticipants =
      runtime.get?.(
        "call.participants"
      );


    const initialParticipantCount =
      Array.isArray(
        initialParticipants
      )
        ? initialParticipants.length
        : Number(
            initialParticipants || 0
          );


    return initialParticipantCount;

  }
);


  const [
    groupRemoteUsers,
    setGroupRemoteUsers,
  ] =
  useState(
    () =>
      runtime.get?.(
        "call.remoteUsers"
      ) || {}
  );


  // ===================================================
  // MEDIA RUNTIME TEST STATE
  // ===================================================

  const [
    mediaSource,
    setMediaSource,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.testSource"
      ) ||
      DEFAULT_VIDEO_SOURCE
  );


  const [
    fileSource,
    setFileSource,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.fileSource.url"
      ) ||
      DEFAULT_PDF_SOURCE
  );


  const [
    fileType,
    setFileType,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.fileSource.type"
      ) ||
      "application/pdf"
  );


  const [
    fileName,
    setFileName,
  ] =
  useState(
    () =>
      runtime.get?.(
        "media.fileSource.name"
      ) ||
      "Test PDF"
  );


  // ===================================================
  // DRAGGING
  // ===================================================

  const dragRef =
    useRef({

      dragging:
        false,

      offsetX:
        0,

      offsetY:
        0,

    });


  // ===================================================
  // REQUEST / ACTION LOCK
  // ===================================================

  const runningActionRef =
    useRef(false);


  // ===================================================
  // RESPONSIVE EFFECT
  // ===================================================

  useEffect(() => {

    const handleResize =
      () => {

        const mobile =
          window.innerWidth <= 600;


        setIsMobile(
          mobile
        );


        if (
          !mobile &&
          !isOpen
        ) {

          setIsOpen(
            true
          );

        }

      };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, [
    isOpen,
  ]);


  // ===================================================
  // TRAINING RUNTIME SUBSCRIPTION
  // ===================================================

  useEffect(() => {

    const initial =
      runtime.get?.(
        "training.participantIds"
      );


    setTrainingParticipantIds(
      Array.isArray(initial)
        ? initial
        : []
    );


    const unsubscribe =
      runtime.subscribe(
        "training.participantIds",
        value => {

          const ids =
            Array.isArray(
              value
            )
              ? value
              : [];


          setTrainingParticipantIds(
            ids
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // GROUP CALL RUNTIME SUBSCRIPTIONS
  // ===================================================
  //
  // This is the important fix for the refresh problem.
  //
  // Every displayed group-call value has its own runtime
  // subscription and React state.
  //
  // ===================================================

  useEffect(() => {

    // -------------------------------------------------
    // INITIAL VALUES
    // -------------------------------------------------

    const initialInvitations =
      runtime.get?.(
        "calls.pendingInvitations"
      );


    setPendingGroupInvitations(
      Array.isArray(
        initialInvitations
      )
        ? initialInvitations
        : []
    );


    setRuntimeGroupCallId(
      runtime.get?.(
        "call.id"
      ) || ""
    );


    setGroupCallChannel(
      runtime.get?.(
        "call.channel"
      ) || ""
    );


    setGroupCallState(
      runtime.get?.(
        "call.state"
      ) || "idle"
    );


    setGroupCallJoined(
      Boolean(
        runtime.get?.(
          "call.joined"
        )
      )
    );


    setGroupCallParticipantCount(
      Number(
        runtime.get?.(
          "call.participants"
        ) || 0
      )
    );


    setGroupRemoteUsers(
      runtime.get?.(
        "call.remoteUsers"
      ) || {}
    );


    // -------------------------------------------------
    // SUBSCRIPTIONS
    // -------------------------------------------------

    const unsubscribeInvitations =
      runtime.subscribe?.(
        "calls.pendingInvitations",
        value => {

          const list =
            Array.isArray(
              value
            )
              ? value
              : [];


          console.log(
            "[RuntimeTest] pending invitations updated",
            {
              count:
                list.length,

              invitations:
                list,
            }
          );


          setPendingGroupInvitations(
            list
          );


          // Keep selected index valid.

          setSelectedGroupInvitationIndex(
            previous =>
              list.length === 0
                ? 0
                : Math.min(
                    previous,
                    list.length - 1
                  )
          );

        }
      );


    const unsubscribeCallId =
      runtime.subscribe?.(
        "call.id",
        value => {

          setRuntimeGroupCallId(
            value || ""
          );

        }
      );


    const unsubscribeChannel =
      runtime.subscribe?.(
        "call.channel",
        value => {

          setGroupCallChannel(
            value || ""
          );

        }
      );


    const unsubscribeState =
      runtime.subscribe?.(
        "call.state",
        value => {

          setGroupCallState(
            value || "idle"
          );

        }
      );


    const unsubscribeJoined =
      runtime.subscribe?.(
        "call.joined",
        value => {

          setGroupCallJoined(
            Boolean(
              value
            )
          );

        }
      );

  const unsubscribeParticipants =
  runtime.subscribe?.(
    "call.participants",
    value => {

      const count =
        Array.isArray(
          value
        )
          ? value.length
          : Number(
              value || 0
            );


      setGroupCallParticipantCount(
        count
      );

    }
  );


    const unsubscribeRemoteUsers =
      runtime.subscribe?.(
        "call.remoteUsers",
        value => {

          setGroupRemoteUsers(
            value || {}
          );

        }
      );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      unsubscribeInvitations?.();

      unsubscribeCallId?.();

      unsubscribeChannel?.();

      unsubscribeState?.();

      unsubscribeJoined?.();

      unsubscribeParticipants?.();

      unsubscribeRemoteUsers?.();

    };

  }, [
    runtime,
  ]);


  // ===================================================
  // DRAG HANDLERS
  // ===================================================

  const handleDragStart =
    event => {

      if (
        event.target.closest(
          "[data-debug-close]"
        )
      ) {

        return;

      }


      dragRef.current.dragging =
        true;


      dragRef.current.offsetX =
        event.clientX -
        position.x;


      dragRef.current.offsetY =
        event.clientY -
        position.y;


      document.addEventListener(
        "pointermove",
        handleDragging
      );


      document.addEventListener(
        "pointerup",
        handleDragEnd
      );

    };


  const handleDragging =
    event => {

      if (
        !dragRef.current.dragging
      ) {

        return;

      }


      const panelWidth =
        isMobile
          ? window.innerWidth - 24
          : 420;


      const panelHeight =
        window.innerHeight * 0.9;


      const nextX =
        event.clientX -
        dragRef.current.offsetX;


      const nextY =
        event.clientY -
        dragRef.current.offsetY;


      setPosition({

        x:
          Math.max(
            8,
            Math.min(
              nextX,
              window.innerWidth -
                panelWidth -
                8
            )
          ),

        y:
          Math.max(
            8,
            Math.min(
              nextY,
              window.innerHeight -
                Math.min(
                  panelHeight,
                  window.innerHeight - 16
                )
            )
          ),

      });

    };


  const handleDragEnd =
    () => {

      dragRef.current.dragging =
        false;


      document.removeEventListener(
        "pointermove",
        handleDragging
      );


      document.removeEventListener(
        "pointerup",
        handleDragEnd
      );

    };


  // =====================================================
  // DEBUG SNAPSHOT
  // =====================================================

  const dumpRuntime =
    () => {

      console.group(
        "FULL RUNTIME SNAPSHOT"
      );


      console.log(
        runtime.getAll()
      );


      console.groupEnd();

    };


  // =====================================================
  // PROJECT DEBUG
  // =====================================================

  const dumpProjectRuntime =
    () => {

      console.group(
        "PROJECT RUNTIME DEBUG"
      );


      console.log(
        "[PROJECT RUNTIME TEST]",
        {

          activeProject,

          runtimeProject,

          runtimeProjectId,

          projectSchemaName:
            projectSchema?.name ||
            null,

          projectSchemaTree:
            projectSchema?.tree ||
            null,

        }
      );


      console.groupEnd();

    };


  // =====================================================
  // VIDEO FEED RESOLUTION
  // =====================================================

  const VIDEO_FEED_SOURCE_ID =
    "interview-video";


  const videoFeedElement =
    findElementBySourceId(
      projectSchema?.tree,
      VIDEO_FEED_SOURCE_ID
    );


  const videoFeedId =
    videoFeedElement?.id ||
    null;


  // =====================================================
  // VIDEO TARGET VALIDATION
  // =====================================================

  const requireVideoFeed =
    () => {

      if (
        videoFeedId
      ) {

        return true;

      }


      console.warn(
        "[RuntimeTest] VideoFeed not found",
        {

          sourceId:
            VIDEO_FEED_SOURCE_ID,

          activeProject,

          runtimeProjectId,

          projectTree:
            projectSchema?.tree,

        }
      );


      return false;

    };


  // =====================================================
  // VIDEO MIC
  // =====================================================

  const toggleVideoFeedMic =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      const result =
        await runAction(
          "video.toggleMic",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] video.toggleMic result:",
        result
      );

    };


  // =====================================================
  // VIDEO CAMERA
  // =====================================================

  const toggleVideoFeedCamera =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      const result =
        await runAction(
          "video.toggleVideo",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] video.toggleVideo result:",
        result
      );

    };


  // =====================================================
  // START RECORDING
  // =====================================================

  const startVideoRecording =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      const result =
        await runAction(
          "video.startRecording",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] startRecording result:",
        result
      );

    };


  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopVideoRecording =
    async () => {

      if (
        !requireVideoFeed()
      ) {

        return;

      }


      const result =
        await runAction(
          "video.stopRecording",
          {

            id:
              videoFeedId,

            targetId:
              videoFeedId,

          }
        );


      console.log(
        "[RuntimeTest] stopRecording result:",
        result
      );

    };


  // =====================================================
  // TRAINING PARTICIPANTS
  // =====================================================

  const getTrainingParticipantIds =
    () => {

      return [
        ...new Set(

          trainingParticipantIds

            .map(
              id =>
                String(
                  id
                ).trim()
            )

            .filter(Boolean)

        ),
      ];

    };


  const trainingParticipantCount =
    getTrainingParticipantIds().length;


  // =====================================================
  // CREATE TRAINING
  // =====================================================

  const createTrainingSession =
    async () => {

      const participantIds =
        getTrainingParticipantIds();


      if (
        participantIds.length ===
        0
      ) {

        console.warn(
          "[RuntimeTest] Cannot create training session - no participants selected"
        );


        return;

      }


      if (
        runningActionRef.current
      ) {

        return;

      }


      runningActionRef.current =
        true;


      try {

        const result =
          await runAction(
            "training.createSession",
            {
              participantIds,
            }
          );


        console.log(
          "[RuntimeTest] training.createSession result:",
          result
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // START TRAINING
  // =====================================================

  const startTrainingSession =
    async () => {

      const participantIds =
        getTrainingParticipantIds();


      if (
        participantIds.length ===
        0
      ) {

        console.warn(
          "[RuntimeTest] Cannot start training session - no participants selected"
        );


        return;

      }


      if (
        runningActionRef.current
      ) {

        return;

      }


      runningActionRef.current =
        true;


      try {

        const result =
          await runAction(
            "training.startSession",
            {
              participantIds,
            }
          );


        console.log(
          "[RuntimeTest] training.startSession result:",
          result
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // END TRAINING
  // =====================================================

  const endTrainingSession =
    async () => {

      const sessionId =
        runtime.get?.(
          "training.sessionId"
        );


      if (
        !sessionId
      ) {

        console.warn(
          "[RuntimeTest] No training session to end"
        );


        return;

      }


      if (
        runningActionRef.current
      ) {

        return;

      }


      runningActionRef.current =
        true;


      try {

        const result =
          await runAction(
            "training.endSession",
            {
              sessionId,
            }
          );


        console.log(
          "[RuntimeTest] training.endSession result:",
          result
        );

      }
      finally {

        runningActionRef.current =
          false;

      }

    };


  // =====================================================
  // GROUP CALL HELPERS
  // =====================================================

  const getGroupParticipantIds =
    () => {

      return [
        ...new Set(

          groupParticipantInput

            .split(
              /[\n,]+/
            )

            .map(
              value =>
                value.trim()
            )

            .filter(Boolean)

        ),
      ];

    };


  const groupParticipantIds =
    getGroupParticipantIds();


  const groupParticipantCount =
    groupParticipantIds.length;


  // =====================================================
  // SELECTED GROUP INVITATION
  // =====================================================

  const selectedGroupInvitation =
    Array.isArray(
      pendingGroupInvitations
    )
      ? pendingGroupInvitations[
          selectedGroupInvitationIndex
        ] || null
      : null;


  // =====================================================
  // ACTIVE GROUP CALL ID
  // =====================================================

  const activeGroupCallId =
    groupCallIdInput.trim() ||
    selectedGroupInvitation?.callId ||
    runtimeGroupCallId ||
    "";


  // =====================================================
  // GROUP ACTION RUNNER
  // =====================================================

  const runGroupAction =
    async (
      action,
      params = {}
    ) => {

      if (
        groupActionRunning
      ) {

        return null;

      }


      setGroupActionRunning(
        true
      );


      try {

        console.log(
          "[RuntimeTest] GROUP ACTION",
          {
            action,
            params,
          }
        );


        const result =
          await runAction(
            action,
            params
          );


        console.log(
          `[RuntimeTest] ${action} result:`,
          result
        );


        return result;

      }
      catch (error) {

        console.error(
          `[RuntimeTest] ${action} failed`,
          error
        );


        return {

          ok:
            false,

          error:
            error?.message ||
            "GROUP_ACTION_FAILED",

        };

      }
      finally {

        setGroupActionRunning(
          false
        );

      }

    };


  // =====================================================
  // CREATE GROUP CALL
  // =====================================================

  const testCreateGroupCall =
    async () => {

      const participantIds =
        getGroupParticipantIds();


      if (
        participantIds.length ===
        0
      ) {

        console.warn(
          "[RuntimeTest] Enter at least one participant ID"
        );


        return;

      }


      const result =
        await runGroupAction(
          "call.createGroupCall",
          {
            participantIds,
          }
        );


      if (
        result?.result?.callId
      ) {

        setGroupCallIdInput(
          String(
            result.result.callId
          )
        );

      }

    };


  // =====================================================
  // FETCH GROUP INVITATIONS
  // =====================================================

  const testFetchPendingInvitations =
    async () => {

      await runGroupAction(
        "call.fetchPendingInvitations"
      );

    };


  // =====================================================
  // SELECT INVITATION
  // =====================================================

  const selectGroupInvitation =
    index => {

      setSelectedGroupInvitationIndex(
        index
      );


      const invitation =
        pendingGroupInvitations[
          index
        ];


      if (
        invitation?.callId
      ) {

        setGroupCallIdInput(
          invitation.callId
        );

      }

    };


  // =====================================================
  // APPLY SELECTED INVITATION
  // =====================================================

  const applySelectedInvitation =
    () => {

      if (
        selectedGroupInvitation?.callId
      ) {

        setGroupCallIdInput(
          selectedGroupInvitation.callId
        );


        console.log(
          "[RuntimeTest] Selected group invitation",
          selectedGroupInvitation
        );

      }

    };


  // =====================================================
  // ACCEPT GROUP INVITATION
  // =====================================================

  const testAcceptInvitation =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID selected"
        );


        return;

      }


      await runGroupAction(
        "call.acceptInvitation",
        {
          callId,
        }
      );

    };


  // =====================================================
  // DECLINE GROUP INVITATION
  // =====================================================

  const testDeclineInvitation =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID selected"
        );


        return;

      }


      await runGroupAction(
        "call.declineInvitation",
        {
          callId,
        }
      );

    };


  // =====================================================
  // JOIN GROUP CALL
  // =====================================================

  const testJoinGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );


        return;

      }


      await runGroupAction(
        "call.joinGroupCall",
        {
          callId,
        }
      );

    };

  
// =====================================================
// REFRESH GROUP CALL
// =====================================================

// =====================================================
// REFRESH GROUP CALL
// =====================================================

const testRefreshGroupCall =
  async () => {

    const callId =
      activeGroupCallId;


    if (
      !callId
    ) {

      console.warn(
        "[RuntimeTest] No group call ID available"
      );

      return;

    }


    console.log(
      "[RuntimeTest] Refreshing group call",
      {
        callId,
      }
    );


    await runGroupAction(
      "call.refreshGroupCall",
      {
        callId,
      }
    );

  };



  // =====================================================
  // LEAVE GROUP CALL
  // =====================================================

  const testLeaveGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );


        return;

      }


      await runGroupAction(
        "call.leaveGroupCall",
        {
          callId,
        }
      );

    };


  // =====================================================
  // END GROUP CALL
  // =====================================================

  const testEndGroupCall =
    async () => {

      const callId =
        activeGroupCallId;


      if (
        !callId
      ) {

        console.warn(
          "[RuntimeTest] No group call ID available"
        );


        return;

      }


      await runGroupAction(
        "call.endGroupCall",
        {
          callId,
        }
      );

    };


  // =====================================================
  // CLEAR GROUP TEST FIELDS
  // =====================================================

  const clearGroupCallTest =
    () => {

      setGroupParticipantInput(
        ""
      );

      setGroupCallIdInput(
        ""
      );

      setSelectedGroupInvitationIndex(
        0
      );

    };


  // =====================================================
  // SET MEDIA TEST SOURCE
  // =====================================================

  const setMediaTestSource =
    () => {

      const value =
        mediaSource.trim();


      if (
        !value
      ) {

        console.warn(
          "[RuntimeTest] Media source is empty"
        );


        return;

      }


      const detectedType =
        detectMediaType(
          value
        );


      runtime.set(
        "media.testSource",
        value
      );


      runtime.set(
        "media.testSourceType",
        detectedType
      );


      console.log(
        "[RuntimeTest] MEDIA SOURCE SET",
        {

          key:
            "media.testSource",

          value,

          detectedType,

        }
      );

    };


  // =====================================================
  // SET DEFAULT MP4
  // =====================================================

  const setBigBuckBunny =
    () => {

      const value =
        DEFAULT_VIDEO_SOURCE;


      setMediaSource(
        value
      );


      runtime.set(
        "media.testSource",
        value
      );


      runtime.set(
        "media.testSourceType",
        "video"
      );


      console.log(
        "[RuntimeTest] Big Buck Bunny source set"
      );

    };


  // =====================================================
  // SET YOUTUBE
  // =====================================================

  const setYouTubeSource =
    () => {

      const value =
        DEFAULT_YOUTUBE_SOURCE;


      setMediaSource(
        value
      );


      runtime.set(
        "media.testSource",
        value
      );


      runtime.set(
        "media.testSourceType",
        "youtube"
      );


      console.log(
        "[RuntimeTest] YouTube source set"
      );

    };


  // =====================================================
  // SET FILE SOURCE
  // =====================================================

  const setFileTestSource =
    () => {

      const url =
        fileSource.trim();


      if (
        !url
      ) {

        console.warn(
          "[RuntimeTest] File source is empty"
        );


        return;

      }


      const source = {

        url,

        type:
          fileType,

        name:
          fileName.trim() ||
          "Test file",

      };


      runtime.set(
        "media.fileSource",
        source
      );


      console.log(
        "[RuntimeTest] FILE SOURCE SET",
        source
      );

    };


  // =====================================================
  // SET DEFAULT PDF
  // =====================================================

  const setDefaultPdf =
    () => {

      const source = {

        url:
          DEFAULT_PDF_SOURCE,

        type:
          "application/pdf",

        name:
          "Test PDF",

      };


      setFileSource(
        source.url
      );


      setFileType(
        source.type
      );


      setFileName(
        source.name
      );


      runtime.set(
        "media.fileSource",
        source
      );


      console.log(
        "[RuntimeTest] Default PDF source set"
      );

    };


  // =====================================================
  // MEDIA RUNTIME SNAPSHOT
  // =====================================================

  const mediaRuntime =
    runtime.get?.(
      "media"
    ) || {};


  // =====================================================
  // COLLAPSED STATE
  // =====================================================

  if (
    !isOpen
  ) {

    return (

      <button

        onClick={() => {
          setIsOpen(
            true
          );
        }}

        style={{

          position:
            "fixed",

          right:
            12,

          bottom:
            12,

          width:
            44,

          height:
            44,

          borderRadius:
            "50%",

          border:
            "1px solid rgba(255,255,255,.2)",

          background:
            "rgba(20,20,20,.92)",

          color:
            "#fff",

          fontSize:
            20,

          cursor:
            "pointer",

          zIndex:
            999999,

          boxShadow:
            "0 4px 16px rgba(0,0,0,.4)",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

        }}

        aria-label=
          "Open Runtime Test Panel"

        title=
          "Open Runtime Test Panel"

      >

        🔧

      </button>

    );

  }


  // =====================================================
  // PANEL
  // =====================================================

  return (

    <div

      style={{

        position:
          "fixed",

        left:
          isMobile
            ? 12
            : position.x,

        top:
          isMobile
            ? 12
            : position.y,

        width:
          isMobile
            ? "calc(100vw - 24px)"
            : window.innerWidth <= 900
              ? 340
              : 420,

        maxWidth:
          "calc(100vw - 24px)",

        maxHeight:
          isMobile
            ? "calc(100vh - 24px)"
            : "90vh",

        background:
          "#1d1d1d",

        color:
          "#fff",

        borderRadius:
          12,

        padding:
          16,

        zIndex:
          999999,

        fontFamily:
          "monospace",

        boxShadow:
          "0 10px 30px rgba(0,0,0,.45)",

        display:
          "flex",

        flexDirection:
          "column",

        boxSizing:
          "border-box",

      }}

    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div

        onPointerDown={
          isMobile
            ? undefined
            : handleDragStart
        }

        style={{

          cursor:
            isMobile
              ? "default"
              : "move",

          userSelect:
            "none",

          fontWeight:
            "bold",

          marginBottom:
            12,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            8,

        }}

      >

        <span>
          Runtime Test Panel
        </span>


        <button

          data-debug-close

          onPointerDown={
            event =>
              event.stopPropagation()
          }

          onClick={() => {

            setIsOpen(
              false
            );

          }}

          style={{

            border:
              "none",

            background:
              "rgba(255,255,255,.08)",

            color:
              "#fff",

            borderRadius:
              6,

            width:
              30,

            height:
              30,

            cursor:
              "pointer",

            fontSize:
              16,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            flexShrink:
              0,

          }}

          aria-label=
            "Minimise Runtime Test Panel"

          title=
            "Minimise Runtime Test Panel"

        >

          −

        </button>

      </div>


      {/* =================================================
          SCROLL CONTENT
      ================================================= */}

      <div

        style={{

          overflowY:
            "auto",

          overflowX:
            "hidden",

          paddingRight:
            8,

          minHeight:
            0,

          WebkitOverflowScrolling:
            "touch",

        }}

      >

        <RuntimeStatusPanel />

        <hr />


        {/* =================================================
            PROJECT
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >
            Project Runtime
          </div>


          <div
            style={{
              fontSize:
                11,

              lineHeight:
                1.5,

              color:
                "#aaa",

              marginBottom:
                8,
            }}
          >

            Active Project:
            {" "}
            {activeProject ||
              "null"}

            <br />

            Runtime Project ID:
            {" "}
            {runtimeProjectId ||
              "null"}

            <br />

            Runtime Project Name:
            {" "}
            {runtimeProject?.name ||
              "null"}

          </div>


          <button

            onClick={
              dumpProjectRuntime
            }

            style={{

              width:
                "100%",

              minHeight:
                34,

              marginBottom:
                8,

              cursor:
                "pointer",

            }}

          >

            Debug Project Runtime

          </button>

        </div>


        <hr />


        {/* =================================================
            EXISTING CALL CONTROLS
        ================================================= */}

        <CallControlsPanel />

        <hr />


        {/* =================================================
            GROUP CALL CONTROLS
        ================================================= */}

        <div>

          <div
            style={{

              fontWeight:
                "bold",

              marginBottom:
                8,

              fontSize:
                13,

            }}
          >

            Group Call Controls

          </div>


          <div
            style={{

              fontSize:
                10,

              color:
                "#888",

              lineHeight:
                1.5,

              marginBottom:
                10,

            }}
          >

            Dedicated development controls for the
            group-call runtime lifecycle.

          </div>


          {/* ---------------------------------------------
              RUNTIME STATE
          --------------------------------------------- */}

          <div
            style={{

              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                8,

              background:
                "#111",

              marginBottom:
                10,

              fontSize:
                10,

              lineHeight:
                1.6,

            }}
          >

            <div>

              Call ID:
              {" "}
              <strong>
                {runtimeGroupCallId ||
                  "none"}
              </strong>

            </div>


            <div>

              Channel:
              {" "}
              <strong>
                {groupCallChannel ||
                  "none"}
              </strong>

            </div>


            <div>

              State:
              {" "}
              <strong>
                {groupCallState}
              </strong>

            </div>


            <div>

              Joined:
              {" "}
              <strong>
                {groupCallJoined
                  ? "true"
                  : "false"}
              </strong>

            </div>


            <div>

              Participants:
              {" "}
              <strong>
                {groupCallParticipantCount}
              </strong>

            </div>


            <div>

              Remote Users:
              {" "}
              <strong>
                {
                  groupRemoteUsers &&
                  typeof groupRemoteUsers ===
                    "object"
                    ? Object.keys(
                        groupRemoteUsers
                      ).length
                    : 0
                }
              </strong>

            </div>


            <div>

              Pending Invitations:
              {" "}
              <strong>
                {pendingGroupInvitations.length}
              </strong>

            </div>

          </div>


          {/* ---------------------------------------------
              PARTICIPANT IDS
          --------------------------------------------- */}

          <label
            style={{

              display:
                "block",

              color:
                "#aaa",

              marginBottom:
                5,

              fontSize:
                11,

            }}
          >

            Participant User IDs

          </label>


          <textarea

            value={
              groupParticipantInput
            }

            onChange={
              event =>
                setGroupParticipantInput(
                  event.target.value
                )
            }

            placeholder={
              "Paste participant IDs separated by commas or new lines"
            }

            rows={4}

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

              resize:
                "vertical",

              padding:
                9,

              marginBottom:
                8,

              background:
                "#111",

              color:
                "#fff",

              border:
                "1px solid #333",

              borderRadius:
                7,

              fontFamily:
                "monospace",

              fontSize:
                10,

            }}

          />


          <div
            style={{

              fontSize:
                10,

              color:
                "#777",

              marginBottom:
                8,

            }}
          >

            Parsed participant IDs:
            {" "}
            {groupParticipantCount}

          </div>


          <button

            onClick={
              testCreateGroupCall
            }

            disabled={
              groupParticipantCount ===
                0 ||
              groupActionRunning
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                groupParticipantCount > 0 &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                groupParticipantCount > 0 &&
                !groupActionRunning
                  ? 1
                  : 0.55,

            }}

          >

            {groupActionRunning
              ? "Running..."
              : "Test Create Group Call"}

          </button>


          {/* ---------------------------------------------
              PENDING INVITATIONS
          --------------------------------------------- */}

          <button

            onClick={
              testFetchPendingInvitations
            }

            disabled={
              groupActionRunning
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                groupActionRunning
                  ? "not-allowed"
                  : "pointer",

            }}

          >

            Test Fetch Pending Invitations

          </button>


          {/* ---------------------------------------------
              INVITATION LIST
          --------------------------------------------- */}

          {pendingGroupInvitations.length >
          0 && (

            <div
              style={{

                marginBottom:
                  10,

                padding:
                  10,

                border:
                  "1px solid #292929",

                borderRadius:
                  8,

                background:
                  "#101010",

              }}
            >

              <div
                style={{

                  color:
                    "#aaa",

                  fontSize:
                    10,

                  marginBottom:
                    8,

                }}
              >

                Pending invitations

              </div>


              {pendingGroupInvitations.map(
                (
                  invitation,
                  index
                ) => {

                  const selected =
                    index ===
                    selectedGroupInvitationIndex;


                  const creatorName =
                    [
                      invitation?.creator?.firstName,
                      invitation?.creator?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");


                  return (

                    <button

                      key={
                        invitation?.callId ||
                        index
                      }

                      onClick={() =>
                        selectGroupInvitation(
                          index
                        )
                      }

                      style={{

                        width:
                          "100%",

                        textAlign:
                          "left",

                        padding:
                          9,

                        marginBottom:
                          6,

                        border:
                          selected
                            ? "1px solid #777"
                            : "1px solid #282828",

                        borderRadius:
                          7,

                        background:
                          selected
                            ? "#202020"
                            : "#151515",

                        color:
                          "#fff",

                        cursor:
                          "pointer",

                      }}

                    >

                      <div
                        style={{
                          fontWeight:
                            "bold",

                          fontSize:
                            10,

                          marginBottom:
                            4,
                        }}
                      >

                        {
                          creatorName ||
                          invitation?.creator?.email ||
                          "Unknown caller"
                        }

                      </div>


                      <div
                        style={{

                          color:
                            "#777",

                          fontSize:
                            9,

                          wordBreak:
                            "break-all",

                        }}
                      >

                        {invitation?.callId}

                      </div>


                      <div
                        style={{

                          color:
                            "#777",

                          fontSize:
                            9,

                          marginTop:
                            3,

                        }}
                      >

                        {invitation?.participant?.status ||
                          invitation?.status ||
                          "invited"}

                      </div>

                    </button>

                  );

                }
              )}


              <button

                onClick={
                  applySelectedInvitation
                }

                disabled={
                  !selectedGroupInvitation
                }

                style={{

                  width:
                    "100%",

                  minHeight:
                    34,

                  marginTop:
                    4,

                  cursor:
                    selectedGroupInvitation
                      ? "pointer"
                      : "not-allowed",

                  opacity:
                    selectedGroupInvitation
                      ? 1
                      : 0.55,

                }}

              >

                Use Selected Invitation

              </button>

            </div>

          )}


          {/* ---------------------------------------------
              GROUP CALL ID
          --------------------------------------------- */}

          <label
            style={{

              display:
                "block",

              color:
                "#aaa",

              marginBottom:
                5,

              fontSize:
                11,

            }}
          >

            Group Call ID

          </label>


          <input

            value={
              groupCallIdInput
            }

            onChange={
              event =>
                setGroupCallIdInput(
                  event.target.value
                )
            }

            placeholder=
              "Group call ObjectId"

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              background:
                "#111",

              color:
                "#fff",

              border:
                "1px solid #333",

              borderRadius:
                7,

              fontFamily:
                "monospace",

              fontSize:
                10,

            }}

          />


          <div
            style={{

              padding:
                8,

              marginBottom:
                8,

              border:
                "1px solid #242424",

              borderRadius:
                7,

              background:
                "#101010",

              color:
                "#777",

              fontSize:
                9,

              wordBreak:
                "break-all",

            }}
          >

            Active test call:

            <br />

            {
              activeGroupCallId ||
              "none"
            }

          </div>


          {/* ---------------------------------------------
              ACCEPT / DECLINE
          --------------------------------------------- */}

          <div
            style={{

              display:
                "flex",

              gap:
                8,

              marginBottom:
                8,

            }}
          >

            <button

              onClick={
                testAcceptInvitation
              }

              disabled={
                !activeGroupCallId ||
                groupActionRunning
              }

              style={{

                flex:
                  1,

                minHeight:
                  36,

                cursor:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? "pointer"
                    : "not-allowed",

                opacity:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? 1
                    : 0.55,

              }}

            >

              Accept Invitation

            </button>


            <button

              onClick={
                testDeclineInvitation
              }

              disabled={
                !activeGroupCallId ||
                groupActionRunning
              }

              style={{

                flex:
                  1,

                minHeight:
                  36,

                cursor:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? "pointer"
                    : "not-allowed",

                opacity:
                  activeGroupCallId &&
                  !groupActionRunning
                    ? 1
                    : 0.55,

              }}

            >

              Decline Invitation

            </button>

          </div>


          {/* ---------------------------------------------
              JOIN
          --------------------------------------------- */}

          <button

            onClick={
              testJoinGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{

              width:
                "100%",

              minHeight:
                38,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,

            }}

          >

            Test Join Group Call

          </button>

        {/* ---------------------------------------------
            REFRESH GROUP CALL
        --------------------------------------------- */}

        <button

          onClick={
            testRefreshGroupCall
          }

          disabled={
            !activeGroupCallId ||
            groupActionRunning
          }

          style={{

            width:
              "100%",

            minHeight:
              38,

            marginBottom:
              8,

            cursor:
              activeGroupCallId &&
              !groupActionRunning
                ? "pointer"
                : "not-allowed",

            opacity:
              activeGroupCallId &&
              !groupActionRunning
                ? 1
                : 0.55,

          }}

        >

          Test Refresh Group Call

        </button>



          {/* ---------------------------------------------
              LEAVE
          --------------------------------------------- */}

          <button

            onClick={
              testLeaveGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,

            }}

          >

            Test Leave Group Call

          </button>


          {/* ---------------------------------------------
              END
          --------------------------------------------- */}

          <button

            onClick={
              testEndGroupCall
            }

            disabled={
              !activeGroupCallId ||
              groupActionRunning
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                activeGroupCallId &&
                !groupActionRunning
                  ? "pointer"
                  : "not-allowed",

              opacity:
                activeGroupCallId &&
                !groupActionRunning
                  ? 1
                  : 0.55,

            }}

          >

            Test End Group Call

          </button>


          {/* ---------------------------------------------
              RESET
          --------------------------------------------- */}

          <button

            onClick={
              clearGroupCallTest
            }

            disabled={
              groupActionRunning
            }

            style={{

              width:
                "100%",

              minHeight:
                32,

              cursor:
                groupActionRunning
                  ? "not-allowed"
                  : "pointer",

            }}

          >

            Clear Group Test Fields

          </button>


          {/* ---------------------------------------------
              SELECTED INVITATION DEBUG
          --------------------------------------------- */}

          {selectedGroupInvitation && (

            <details
              style={{

                marginTop:
                  10,

              }}
            >

              <summary
                style={{

                  cursor:
                    "pointer",

                  color:
                    "#888",

                  fontSize:
                    10,

                }}
              >

                Selected Invitation Debug

              </summary>


              <pre
                style={{

                  marginTop:
                    8,

                  padding:
                    10,

                  background:
                    "#0d0d0d",

                  border:
                    "1px solid #242424",

                  borderRadius:
                    7,

                  overflow:
                    "auto",

                  fontSize:
                    9,

                  color:
                    "#bbb",

                  whiteSpace:
                    "pre-wrap",

                  wordBreak:
                    "break-word",

                }}
              >

                {
                  JSON.stringify(
                    selectedGroupInvitation,
                    null,
                    2
                  )
                }

              </pre>

            </details>

          )}

        </div>


        <hr />


        {/* =================================================
            TRAINING CONTROLS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Training Controls

          </div>


          <div
            style={{

              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.5,

            }}
          >

            Selected participants:
            {" "}
            {trainingParticipantCount}

            <br />

            Session ID:
            {" "}
            {
              runtime.get?.(
                "training.sessionId"
              ) ||
              "none"
            }

            <br />

            Status:
            {" "}
            {
              runtime.get?.(
                "training.status"
              ) ||
              "none"
            }

          </div>


          <button

            onClick={
              createTrainingSession
            }

            disabled={
              trainingParticipantCount === 0
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                trainingParticipantCount > 0
                  ? "pointer"
                  : "not-allowed",

              opacity:
                trainingParticipantCount > 0
                  ? 1
                  : 0.55,

            }}

          >

            Test Create Training Session
            {" "}
            (
            {trainingParticipantCount}
            )

          </button>


          <button

            onClick={
              startTrainingSession
            }

            disabled={
              trainingParticipantCount === 0
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                trainingParticipantCount > 0
                  ? "pointer"
                  : "not-allowed",

              opacity:
                trainingParticipantCount > 0
                  ? 1
                  : 0.55,

            }}

          >

            Test Start Training Session
            {" "}
            (
            {trainingParticipantCount}
            )

          </button>


          <button

            onClick={
              endTrainingSession
            }

            disabled={
              !runtime.get?.(
                "training.sessionId"
              )
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                runtime.get?.(
                  "training.sessionId"
                )
                  ? "pointer"
                  : "not-allowed",

              opacity:
                runtime.get?.(
                  "training.sessionId"
                )
                  ? 1
                  : 0.55,

            }}

          >

            Test End Training Session

          </button>

        </div>


        <hr />


        {/* =================================================
            MEDIA RUNTIME TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Media Runtime Tests

          </div>


          <div
            style={{

              fontSize:
                11,

              color:
                "#aaa",

              lineHeight:
                1.5,

              marginBottom:
                10,

            }}
          >

            Runtime source:
            {" "}
            <strong>
              media.testSource
            </strong>

            <br />

            Current type:
            {" "}
            {
              mediaRuntime?.testSourceType ||
              detectMediaType(
                mediaRuntime?.testSource
              )
            }

          </div>


          <input

            type="text"

            value={
              mediaSource
            }

            onChange={
              event =>
                setMediaSource(
                  event.target.value
                )
            }

            placeholder=
              "Enter video / media URL"

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                "#fff",

              fontSize:
                11,

              outline:
                "none",

            }}

          />


          <button

            onClick={
              setMediaTestSource
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",

            }}

          >

            Set Media Runtime Source

          </button>


          <div
            style={{
              display:
                "flex",

              gap:
                8,

              marginBottom:
                10,

            }}
          >

            <button

              onClick={
                setBigBuckBunny
              }

              style={{

                flex:
                  1,

                minHeight:
                  34,

                cursor:
                  "pointer",

              }}

            >

              Big Buck Bunny

            </button>


            <button

              onClick={
                setYouTubeSource
              }

              style={{

                flex:
                  1,

                minHeight:
                  34,

                cursor:
                  "pointer",

              }}

            >

              YouTube

            </button>

          </div>


          <div
            style={{

              fontSize:
                10,

              color:
                "#777",

              lineHeight:
                1.5,

            }}
          >

            Runtime binding:

            <br />

            {"{{media.testSource}}"}

          </div>

        </div>


        <hr />


        {/* =================================================
            FILE PREVIEW RUNTIME TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            File Preview Runtime Tests

          </div>


          <div
            style={{

              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.5,

            }}
          >

            Runtime source:
            {" "}
            <strong>
              media.fileSource
            </strong>

          </div>


          <input

            type="text"

            value={
              fileSource
            }

            onChange={
              event =>
                setFileSource(
                  event.target.value
                )
            }

            placeholder=
              "File URL"

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                "#fff",

              fontSize:
                11,

              outline:
                "none",

            }}

          />


          <select

            value={
              fileType
            }

            onChange={
              event =>
                setFileType(
                  event.target.value
                )
            }

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "8px 10px",

              marginBottom:
                8,

              background:
                "#111",

              color:
                "#fff",

              border:
                "1px solid #333",

              borderRadius:
                7,

              fontSize:
                11,

            }}

          >

            <option value="application/pdf">
              PDF
            </option>

            <option value="image/png">
              PNG Image
            </option>

            <option value="image/jpeg">
              JPEG Image
            </option>

            <option value="video/mp4">
              MP4 Video
            </option>

          </select>


          <input

            type="text"

            value={
              fileName
            }

            onChange={
              event =>
                setFileName(
                  event.target.value
                )
            }

            placeholder=
              "File name"

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

              padding:
                "9px 10px",

              marginBottom:
                8,

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                "#fff",

              fontSize:
                11,

              outline:
                "none",

            }}

          />


          <button

            onClick={
              setFileTestSource
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                "pointer",

            }}

          >

            Set File Runtime Source

          </button>


          <button

            onClick={
              setDefaultPdf
            }

            style={{

              width:
                "100%",

              minHeight:
                34,

              marginBottom:
                10,

              cursor:
                "pointer",

            }}

          >

            Use Default Test PDF

          </button>


          <div
            style={{

              fontSize:
                10,

              color:
                "#777",

              lineHeight:
                1.5,

            }}
          >

            Runtime binding:

            <br />

            {"{{media.fileSource}}"}

          </div>

        </div>


        <hr />


        {/* =================================================
            REMOTE VIDEO GRID
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            Remote Video Grid

          </div>


          <div
            style={{

              fontSize:
                11,

              color:
                "#aaa",

              lineHeight:
                1.5,

              marginBottom:
                10,

            }}
          >

            Runtime source:
            {" "}
            <strong>
              call.remoteUsers
            </strong>

            <br />

            Remote participants:
            {" "}
            {
              groupRemoteUsers &&
              typeof groupRemoteUsers ===
                "object"
                ? Object.keys(
                    groupRemoteUsers
                  ).length
                : 0
            }

          </div>


          <div
            style={{

              padding:
                10,

              border:
                "1px solid #292929",

              borderRadius:
                7,

              background:
                "#111",

              marginBottom:
                8,

              fontSize:
                10,

              color:
                groupRemoteUsers &&
                typeof groupRemoteUsers ===
                  "object" &&
                Object.keys(
                  groupRemoteUsers
                ).length > 0
                  ? "#86efac"
                  : "#777",

            }}

          >

            {
              groupRemoteUsers &&
              typeof groupRemoteUsers ===
                "object" &&
              Object.keys(
                groupRemoteUsers
              ).length > 0
                ? `✓ ${Object.keys(groupRemoteUsers).length} remote participant${Object.keys(groupRemoteUsers).length === 1 ? "" : "s"} available`
                : "No remote participants currently connected"
            }

          </div>


          <div
            style={{

              fontSize:
                10,

              color:
                "#777",

              lineHeight:
                1.5,

            }}
          >

            Test with a real Agora call and install:

            <br />

            Remote Video Grid Test

            <br /><br />

            The component should consume:

            <br />

            call.remoteUsers

          </div>

        </div>


        <hr />


        {/* =================================================
            VIDEOFEED MEDIA TESTS
        ================================================= */}

        <div>

          <div
            style={{
              fontWeight:
                "bold",

              marginBottom:
                8,
            }}
          >

            VideoFeed Media Tests

          </div>


          <div
            style={{

              fontSize:
                11,

              color:
                "#aaa",

              marginBottom:
                10,

              lineHeight:
                1.4,

            }}
          >

            Stable source ID:
            {" "}
            {VIDEO_FEED_SOURCE_ID}

            <br />

            Resolved Canvas ID:
            {" "}
            {videoFeedId ||
              "Not found"}

          </div>


          <button

            onClick={
              toggleVideoFeedMic
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test VideoFeed Mic Toggle

          </button>


          <button

            onClick={
              toggleVideoFeedCamera
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test VideoFeed Camera Toggle

          </button>


          <button

            onClick={
              startVideoRecording
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test Start Recording

          </button>


          <button

            onClick={
              stopVideoRecording
            }

            disabled={
              !videoFeedId
            }

            style={{

              width:
                "100%",

              minHeight:
                36,

              marginBottom:
                8,

              cursor:
                videoFeedId
                  ? "pointer"
                  : "not-allowed",

            }}

          >

            Test Stop Recording

          </button>

        </div>


        <hr />


        {/* =================================================
            INTERVIEW
        ================================================= */}

        <InterviewControlsPanel />

        <hr />


        {/* =================================================
            MEDIA RUNTIME SNAPSHOT
        ================================================= */}

        <details>

          <summary
            style={{
              cursor:
                "pointer",

              color:
                "#aaa",

              marginBottom:
                10,

            }}
          >

            Media Runtime Snapshot

          </summary>


          <pre
            style={{

              background:
                "#101010",

              padding:
                10,

              borderRadius:
                6,

              overflow:
                "auto",

              fontSize:
                10,

              color:
                "#ccc",

            }}
          >

            {
              JSON.stringify(
                mediaRuntime,
                null,
                2
              )
            }

          </pre>

        </details>


        <hr />


        {/* =================================================
            FULL RUNTIME SNAPSHOT
        ================================================= */}

        <button

          onClick={
            dumpRuntime
          }

          style={{

            width:
              "100%",

            marginTop:
              12,

            minHeight:
              36,

            cursor:
              "pointer",

          }}

        >

          Dump Runtime

        </button>

      </div>

    </div>

  );

}
