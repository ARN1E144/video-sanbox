// src/components/elements/IncomingGroupCallAlert.js

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";

import {
  useActionContext,
} from "../../context/ActionContext";


// =====================================================
// SAFE TEXT
// =====================================================

function safeText(
  value,
  fallback = ""
) {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;

  }


  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return String(
      value
    );

  }


  return fallback;

}


// =====================================================
// NORMALISE INVITATION
// =====================================================

function normaliseInvitation(
  invitation
) {

  if (
    !invitation ||
    typeof invitation !== "object"
  ) {

    return null;

  }


  const creator =
    invitation.creator ||
    {};


  const participant =
    invitation.participant ||
    {};


  const callId =
    invitation.callId ||
    invitation._id ||
    invitation.id ||
    null;


  if (
    !callId
  ) {

    return null;

  }


  const creatorName =
    [
      creator.firstName,
      creator.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();


  return {

    ...invitation,

    callId:
      String(
        callId
      ),

    creatorName:
      creatorName ||
      creator.name ||
      creator.email ||
      "Someone",

    creatorEmail:
      creator.email ||
      "",

    channelName:
      invitation.channelName ||
      "",

    status:
      invitation.status ||
      "ringing",

    participantStatus:
      participant.status ||
      invitation.participantStatus ||
      "invited",

  };

}


// =====================================================
// COMPONENT
// =====================================================

export default function IncomingGroupCallAlert({

  source =
    "calls.pendingInvitations",

  title =
    "Incoming Group Call",

  message =
    "has invited you to join a group call.",

  acceptLabel =
    "Accept",

  declineLabel =
    "Decline",

  joinLabel =
    "Join Call",

  acceptedMessage =
    "Invitation accepted. Join when you are ready.",

  showChannel =
    false,

  position =
    "top-right",

  style =
    {},

}) {

  const runtime =
    useRuntimeState();


  const {
    runAction,
  } =
  useActionContext();


  // ===================================================
  // INVITATIONS
  // ===================================================

  const [
    invitations,
    setInvitations,
  ] =
  useState(
    []
  );


  // ===================================================
  // LOCAL ACCEPTED STATE
  // ===================================================
  //
  // This deliberately lives outside the server's
  // pending-invitation collection.
  //
  // Once accepted, the backend will normally stop
  // returning the invitation from /invitations.
  //
  // We therefore preserve the selected invitation
  // locally until the user joins or dismisses it.
  //
  // ===================================================

  const [
    acceptedInvitations,
    setAcceptedInvitations,
  ] =
  useState({});


  // ===================================================
  // ACTION STATE
  // ===================================================

  const [
    actionRunning,
    setActionRunning,
  ] =
  useState(false);


  const [
    processingCallId,
    setProcessingCallId,
  ] =
  useState(null);


  // ===================================================
  // DISMISSED
  // ===================================================

  const [
    dismissedIds,
    setDismissedIds,
  ] =
  useState(
    () =>
      new Set()
  );


  // ===================================================
  // RESOLVE RUNTIME PATH
  // ===================================================

  const runtimePath =
    useMemo(
      () => {

        if (
          typeof source !== "string"
        ) {

          return null;

        }


        return source
          .trim()
          .replace(
            /^\{\{/,
            ""
          )
          .replace(
            /\}\}$/,
            ""
          )
          .trim();

      },
      [
        source,
      ]
    );


  // ===================================================
  // INITIAL VALUE
  // ===================================================

  useEffect(() => {

    if (
      runtimePath
    ) {

      const value =
        runtime.get?.(
          runtimePath
        );


      setInvitations(
        Array.isArray(
          value
        )
          ? value
          : []
      );


      return;

    }


    setInvitations(
      Array.isArray(
        source
      )
        ? source
        : []
    );

  }, [
    runtime,
    runtimePath,
    source,
  ]);


  // ===================================================
  // RUNTIME SUBSCRIPTION
  // ===================================================

  useEffect(() => {

    if (
      !runtimePath
    ) {

      return undefined;

    }


    const unsubscribe =
      runtime.subscribe?.(
        runtimePath,
        value => {

          setInvitations(
            Array.isArray(
              value
            )
              ? value
              : []
          );

        }
      );


    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
    runtimePath,
  ]);


  // ===================================================
  // NORMALISE
  // ===================================================

  const normalisedInvitations =
    useMemo(
      () =>
        invitations
          .map(
            normaliseInvitation
          )
          .filter(Boolean),
      [
        invitations,
      ]
    );


  // ===================================================
  // ACTIVE PENDING INVITATIONS
  // ===================================================

  const visibleInvitations =
    useMemo(
      () =>
        normalisedInvitations.filter(
          invitation =>
            !dismissedIds.has(
              invitation.callId
            ) &&
            !acceptedInvitations[
              invitation.callId
            ]
        ),
      [
        normalisedInvitations,
        dismissedIds,
        acceptedInvitations,
      ]
    );


  // ===================================================
  // ACCEPTED INVITATIONS
  // ===================================================

  const acceptedList =
    useMemo(
      () =>
        Object.values(
          acceptedInvitations
        )
          .map(
            normaliseInvitation
          )
          .filter(Boolean)
          .filter(
            invitation =>
              !dismissedIds.has(
                invitation.callId
              )
          ),
      [
        acceptedInvitations,
        dismissedIds,
      ]
    );


  // ===================================================
  // CURRENT INVITATION
  // ===================================================

  const invitation =
    visibleInvitations[0] ||
    null;


  // ===================================================
  // CURRENT ACCEPTED CALL
  // ===================================================

  const acceptedInvitation =
    acceptedList[0] ||
    null;


  // ===================================================
  // ACCEPT
  // ===================================================

  const handleAccept =
    async () => {

      if (
        !invitation?.callId ||
        actionRunning
      ) {

        return;

      }


      const callId =
        invitation.callId;


      setActionRunning(
        true
      );


      setProcessingCallId(
        callId
      );


      try {

        console.log(
          "[IncomingGroupCallAlert] ACCEPT",
          {
            callId,
            invitation,
          }
        );


        const result =
          await runAction(
            "call.acceptInvitation",
            {
              callId,
            }
          );


        console.log(
          "[IncomingGroupCallAlert] ACCEPT RESULT",
          result
        );


        if (
          result?.ok === false
        ) {

          return;

        }


        // ---------------------------------------------
        // Preserve the accepted invitation locally.
        // ---------------------------------------------

        setAcceptedInvitations(
          previous => ({

            ...previous,

            [callId]:
              {
                ...invitation,

                participantStatus:
                  "accepted",

              },

          })
        );


        // ---------------------------------------------
        // Remove it from the incoming state.
        // ---------------------------------------------

        console.log(
          "[IncomingGroupCallAlert] Invitation accepted - waiting for join"
        );

      }
      catch (error) {

        console.error(
          "[IncomingGroupCallAlert] ACCEPT FAILED",
          error
        );

      }
      finally {

        setActionRunning(
          false
        );

        setProcessingCallId(
          null
        );

      }

    };


  // ===================================================
  // DECLINE
  // ===================================================

  const handleDecline =
    async invitationToDecline => {

      if (
        !invitationToDecline?.callId ||
        actionRunning
      ) {

        return;

      }


      const callId =
        invitationToDecline.callId;


      setActionRunning(
        true
      );


      setProcessingCallId(
        callId
      );


      try {

        console.log(
          "[IncomingGroupCallAlert] DECLINE",
          {
            callId,
          }
        );


        const result =
          await runAction(
            "call.declineInvitation",
            {
              callId,
            }
          );


        console.log(
          "[IncomingGroupCallAlert] DECLINE RESULT",
          result
        );


        if (
          result?.ok === false
        ) {

          return;

        }


        setDismissedIds(
          previous => {

            const next =
              new Set(
                previous
              );


            next.add(
              callId
            );


            return next;

          }
        );

      }
      catch (error) {

        console.error(
          "[IncomingGroupCallAlert] DECLINE FAILED",
          error
        );

      }
      finally {

        setActionRunning(
          false
        );

        setProcessingCallId(
          null
        );

      }

    };


  // ===================================================
  // JOIN
  // ===================================================

  const handleJoin =
    async invitationToJoin => {

      if (
        !invitationToJoin?.callId ||
        actionRunning
      ) {

        return;

      }


      const callId =
        invitationToJoin.callId;


      setActionRunning(
        true
      );


      setProcessingCallId(
        callId
      );


      try {

        console.log(
          "[IncomingGroupCallAlert] JOIN",
          {
            callId,
            invitation:
              invitationToJoin,
          }
        );


        const result =
          await runAction(
            "call.joinGroupCall",
            {
              callId,
            }
          );


        console.log(
          "[IncomingGroupCallAlert] JOIN RESULT",
          result
        );


        if (
          result?.ok === false
        ) {

          return;

        }


        // ---------------------------------------------
        // The active call is now represented by
        // call.id / call.channel / call.state.
        //
        // Remove the local accepted invitation.
        // ---------------------------------------------

        setAcceptedInvitations(
          previous => {

            const next = {
              ...previous,
            };


            delete next[
              callId
            ];


            return next;

          }
        );


      }
      catch (error) {

        console.error(
          "[IncomingGroupCallAlert] JOIN FAILED",
          error
        );

      }
      finally {

        setActionRunning(
          false
        );

        setProcessingCallId(
          null
        );

      }

    };


  // ===================================================
  // DISMISS
  // ===================================================

  const dismiss =
    callId => {

      if (
        !callId
      ) {

        return;

      }


      setDismissedIds(
        previous => {

          const next =
            new Set(
              previous
            );


          next.add(
            callId
          );


          return next;

        }
      );

    };


  // ===================================================
  // NOTHING TO DISPLAY
  // ===================================================

  if (
    !invitation &&
    !acceptedInvitation
  ) {

    return null;

  }


  // ===================================================
  // POSITION
  // ===================================================

  const positionStyle =
    position === "top-left"

      ? {
          top:
            16,
          left:
            16,
        }

      : position === "bottom-left"

        ? {
            bottom:
              16,
            left:
              16,
          }

        : position === "bottom-right"

          ? {
              bottom:
                16,
              right:
                16,
            }

          : {
              top:
                16,
              right:
                16,
            };


  // ===================================================
  // ACTIVE CARD
  // ===================================================

  const activeInvitation =
    acceptedInvitation ||
    invitation;


  const isAccepted =
    Boolean(
      acceptedInvitation
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{

        position:
          "fixed",

        ...positionStyle,

        width:
          "min(380px, calc(100vw - 32px))",

        boxSizing:
          "border-box",

        padding:
          16,

        border:
          "1px solid #333",

        borderRadius:
          12,

        background:
          "#181818",

        color:
          "#fff",

        boxShadow:
          "0 12px 32px rgba(0,0,0,.45)",

        zIndex:
          999999,

        ...style,

      }}
    >

      {/* =============================================
          TITLE
      ============================================= */}

      <div
        style={{
          fontSize:
            14,

          fontWeight:
            700,

          marginBottom:
            8,
        }}
      >

        {isAccepted
          ? "Group Call Invitation Accepted"
          : title}

      </div>


      {/* =============================================
          MESSAGE
      ============================================= */}

      <div
        style={{
          fontSize:
            12,

          color:
            "#bbb",

          lineHeight:
            1.45,

          marginBottom:
            10,
        }}
      >

        <strong
          style={{
            color:
              "#fff",
          }}
        >

          {safeText(
            activeInvitation?.creatorName,
            "Someone"
          )}

        </strong>

        {" "}

        {isAccepted
          ? acceptedMessage
          : message}

      </div>


      {/* =============================================
          CREATOR EMAIL
      ============================================= */}

      {activeInvitation?.creatorEmail && (

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

          {activeInvitation.creatorEmail}

        </div>

      )}


      {/* =============================================
          CHANNEL
      ============================================= */}

      {showChannel &&
      activeInvitation?.channelName && (

        <div
          style={{
            marginBottom:
              10,

            padding:
              7,

            borderRadius:
              6,

            background:
              "#111",

            color:
              "#666",

            fontSize:
              9,

            wordBreak:
              "break-all",
          }}
        >

          {activeInvitation.channelName}

        </div>

      )}


      {/* =============================================
          ACCEPTED STATUS
      ============================================= */}

      {isAccepted && (

        <div
          style={{
            marginBottom:
              10,

            padding:
              8,

            border:
              "1px solid #24452d",

            borderRadius:
              7,

            background:
              "#102117",

            color:
              "#86efac",

            fontSize:
              10,
          }}
        >

          Invitation accepted. The call has not been
          joined yet.

        </div>

      )}


      {/* =============================================
          ACTIONS
      ============================================= */}

      <div
        style={{
          display:
            "flex",

          gap:
            8,
        }}
      >

        {!isAccepted && (

          <button

            type="button"

            onClick={() =>
              handleDecline(
                invitation
              )
            }

            disabled={
              actionRunning
            }

            style={{
              flex:
                1,

              minHeight:
                38,

              border:
                "1px solid #444",

              borderRadius:
                7,

              background:
                "#222",

              color:
                "#fff",

              cursor:
                actionRunning
                  ? "default"
                  : "pointer",

              opacity:
                actionRunning
                  ? 0.6
                  : 1,
            }}
          >

            {
              actionRunning &&
              processingCallId ===
                invitation?.callId

                ? "Working..."

                : declineLabel
            }

          </button>

        )}


        {!isAccepted && (

          <button

            type="button"

            onClick={
              handleAccept
            }

            disabled={
              actionRunning
            }

            style={{
              flex:
                1,

              minHeight:
                38,

              border:
                "none",

              borderRadius:
                7,

              background:
                "#2563eb",

              color:
                "#fff",

              fontWeight:
                600,

              cursor:
                actionRunning
                  ? "default"
                  : "pointer",

              opacity:
                actionRunning
                  ? 0.6
                  : 1,
            }}
          >

            {
              actionRunning &&
              processingCallId ===
                invitation?.callId

                ? "Working..."

                : acceptLabel
            }

          </button>

        )}


        {isAccepted && (

          <>

            <button

              type="button"

              onClick={() =>
                dismiss(
                  acceptedInvitation.callId
                )
              }

              disabled={
                actionRunning
              }

              style={{
                flex:
                  1,

                minHeight:
                  38,

                border:
                  "1px solid #444",

                borderRadius:
                  7,

                background:
                  "#222",

                color:
                  "#fff",

                cursor:
                  actionRunning
                    ? "default"
                    : "pointer",

              }}
            >

              Later

            </button>


            <button

              type="button"

              onClick={() =>
                handleJoin(
                  acceptedInvitation
                )
              }

              disabled={
                actionRunning
              }

              style={{
                flex:
                  1,

                minHeight:
                  38,

                border:
                  "none",

                borderRadius:
                  7,

                background:
                  "#2563eb",

                color:
                  "#fff",

                fontWeight:
                  600,

                cursor:
                  actionRunning
                    ? "default"
                    : "pointer",

                opacity:
                  actionRunning
                    ? 0.6
                    : 1,
              }}
            >

              {
                actionRunning &&
                processingCallId ===
                  acceptedInvitation.callId

                  ? "Joining..."

                  : joinLabel
              }

            </button>

          </>

        )}

      </div>


      {/* =============================================
          ADDITIONAL INVITATIONS
      ============================================= */}

      {!isAccepted &&
      visibleInvitations.length > 1 && (

        <div
          style={{
            marginTop:
              9,

            fontSize:
              9,

            color:
              "#666",

            textAlign:
              "center",
          }}
        >

          +{visibleInvitations.length - 1}
          {" "}
          more pending invitation
          {visibleInvitations.length === 2
            ? ""
            : "s"}

        </div>

      )}

    </div>

  );

}