// src/components/elements/ConversationList.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";

import {
  useActionContext,
} from "../../context/ActionContext";

import {
  useAuth,
} from "../../context/AuthContext";


// =====================================================
// HELPERS
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  if (
    typeof value === "object"
  ) {

    value =
      value?.userId ||
      value?.id ||
      value?._id ||
      null;

  }


  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


function getCurrentUserId(
  session
) {

  return normaliseId(
    session?.user?.id ??
    session?.user?._id ??
    session?.me?.id ??
    session?.me?._id
  );

}


function getParticipantForUser(
  conversation,
  userId
) {

  if (
    !conversation ||
    !userId ||
    !Array.isArray(
      conversation?.participants
    )
  ) {

    return null;

  }


  return (
    conversation.participants.find(
      participant =>
        normaliseId(
          participant?.userId
        ) ===
        userId
    ) ||
    null
  );

}


function getConversationTitle(
  conversation
) {

  const title =
    String(
      conversation?.title ||
      ""
    ).trim();


  if (
    title
  ) {

    return title;

  }


  if (
    conversation?.type ===
    "group"
  ) {

    return "Group conversation";

  }


  return "Conversation";

}


function getParticipantName(
  participant
) {

  const fullName =
    [
      participant?.firstName,
      participant?.lastName,
    ]
      .filter(Boolean)
      .map(
        value =>
          String(
            value
          ).trim()
      )
      .filter(Boolean)
      .join(" ")
      .trim();


  return (
    fullName ||
    participant?.name ||
    participant?.email ||
    "A user"
  );

}


// =====================================================
// NORMALISE CONVERSATIONS
// =====================================================
//
// The backend already limits the collection to:
//
//   participant.status === "invited"
//   OR
//   participant.status === "active"
//
// We still perform the participant-state check here.
//
// IMPORTANT:
//
// conversation.status is the conversation lifecycle
// ("active" / "closed").
//
// participant.status is the user's membership state
// ("invited" / "active" / "left" / "declined").
//
// Invitation UI MUST use participant.status.
//
// =====================================================

function normaliseConversations(
  conversations,
  userId
) {

  if (
    !Array.isArray(
      conversations
    )
  ) {

    return [];

  }


  return conversations
    .map(
      conversation => {

        if (
          !conversation
        ) {

          return null;

        }


        const id =
          normaliseId(
            conversation?.id ??
            conversation?._id
          );


        if (
          !id
        ) {

          return null;

        }


        const participant =
          getParticipantForUser(
            conversation,
            userId
          );


        if (
          !participant
        ) {

          return null;

        }


        if (
          participant.status !==
            "invited" &&
          participant.status !==
            "active"
        ) {

          return null;

        }


        return {

          ...conversation,

          id,

          participant,

        };

      }
    )
    .filter(Boolean);

}


// =====================================================
// COMPONENT
// =====================================================

export default function ConversationList({

  title =
    "Conversations",

  emptyText =
    "No conversations yet.",

}) {

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
    session,
  } =
  useAuth();


  // ===================================================
  // CURRENT USER
  // ===================================================

  const currentUserId =
    useMemo(
      () =>
        getCurrentUserId(
          session
        ),
      [
        session,
      ]
    );


  // ===================================================
  // INITIAL RUNTIME STATE
  // ===================================================

  const initialConversations =
    normaliseConversations(
      runtime.get?.(
        "chat.conversations"
      ),
      currentUserId
    );

  const initialSelectedId =
    normaliseId(
      runtime.get?.(
        "chat.conversationId"
      )
    );

  const initialProjectId =
    normaliseId(
      runtime.get?.(
        "project.id"
      )
    );


  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [
    conversations,
    setConversations,
  ] =
  useState(
    initialConversations
  );

  const [
    selectedId,
    setSelectedId,
  ] =
  useState(
    initialSelectedId
  );

  const [
    projectId,
    setProjectId,
  ] =
  useState(
    initialProjectId
  );

  const [
    loading,
    setLoading,
  ] =
  useState(
    false
  );

  const [
    actionConversationId,
    setActionConversationId,
  ] =
  useState(
    null
  );

  const [
    error,
    setError,
  ] =
  useState(
    null
  );


  // ===================================================
  // REFS
  // ===================================================

  const mountedRef =
    useRef(false);

  const loadingRef =
    useRef(false);

  const actionConversationIdRef =
    useRef(null);


  // ===================================================
  // KEEP REFS SYNCHRONISED
  // ===================================================

  actionConversationIdRef.current =
    actionConversationId;


  // ===================================================
  // RUNTIME SUBSCRIPTIONS
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    // -------------------------------------------------
    // CONVERSATIONS
    // -------------------------------------------------

    const unsubscribeConversations =
      runtime.subscribe?.(
        "chat.conversations",
        value => {

          const next =
            normaliseConversations(
              value,
              currentUserId
            );


          setConversations(
            next
          );

        }
      );


    // -------------------------------------------------
    // ACTIVE CONVERSATION
    // -------------------------------------------------

    const unsubscribeConversationId =
      runtime.subscribe?.(
        "chat.conversationId",
        value => {

          const nextId =
            normaliseId(
              value
            );

          setSelectedId(
            nextId
          );

        }
      );


    // -------------------------------------------------
    // PROJECT
    // -------------------------------------------------

    const unsubscribeProjectId =
      runtime.subscribe?.(
        "project.id",
        value => {

          setProjectId(
            normaliseId(
              value
            )
          );

        }
      );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      mountedRef.current =
        false;

      unsubscribeConversations?.();

      unsubscribeConversationId?.();

      unsubscribeProjectId?.();

    };

  }, [
    runtime,
    currentUserId,
  ]);


  // ===================================================
  // LOAD CONVERSATIONS
  // ===================================================

  const loadConversationList =
    useCallback(
      async ({
        reason =
          "initial",
      } = {}) => {

        if (
          !mountedRef.current
        ) {

          return null;

        }


        const activeProjectId =
          normaliseId(
            projectId ||
            runtime.get?.(
              "project.id"
            )
          );


        if (
          !activeProjectId
        ) {

          return null;

        }


        if (
          loadingRef.current
        ) {

          return null;

        }


        loadingRef.current =
          true;

        setLoading(
          true
        );

        setError(
          null
        );


        try {

          console.log(
            "[ConversationList] Loading conversations",
            {

              reason,

              projectId:
                activeProjectId,

            }
          );


          const result =
            await runAction(
              "chat.loadConversations",
              {

                projectId:
                  activeProjectId,

              }
            );


          if (
            result?.ok ===
            false
          ) {

            console.warn(
              "[ConversationList] Conversation load failed",
              result
            );

            if (
              mountedRef.current
            ) {

              setError(
                result?.error ||
                result?.result?.error ||
                "Failed to load conversations"
              );

            }

            return result;

          }


          return result;

        }
        catch (loadError) {

          console.error(
            "[ConversationList] Conversation load failed",
            loadError
          );


          if (
            mountedRef.current
          ) {

            setError(
              loadError?.response?.data?.error ||
              loadError?.response?.data?.message ||
              loadError?.message ||
              "Failed to load conversations"
            );

          }


          return {

            ok:
              false,

            error:
              loadError?.message ||
              "CHAT_CONVERSATIONS_LOAD_FAILED",

          };

        }
        finally {

          loadingRef.current =
            false;

          if (
            mountedRef.current
          ) {

            setLoading(
              false
            );

          }

        }

      },
      [
        projectId,
        runtime,
        runAction,
      ]
    );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    if (
      !projectId
    ) {

      return;

    }


    loadConversationList({
      reason:
        "project-ready",
    });

  }, [
    projectId,
    loadConversationList,
  ]);

  // ===================================================
  // REFRESH WHEN A CHAT INVITATION ARRIVES
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      runtime.subscribe?.(
        "chat.invitations",
        invitations => {

          if (
            !mountedRef.current ||
            !Array.isArray(invitations) ||
            invitations.length === 0
          ) {

            return;

          }

          loadConversationList({
            reason: "incoming-invitation",
          });

        }
      );

    return () => {

      unsubscribe?.();

    };

  }, [
    runtime,
    loadConversationList,
  ]);


  // ===================================================
  // SELECT CONVERSATION
  // ===================================================

  const handleSelect =
    useCallback(
      (
        conversation
      ) => {

        const conversationId =
          normaliseId(
            conversation?.id
          );


        if (
          !conversationId
        ) {

          return;

        }


        setSelectedId(
          conversationId
        );


        runtime.set?.(
          "chat.conversationId",
          conversationId
        );


        console.log(
          "[ConversationList] Conversation selected",
          {

            conversationId,

          }
        );

      },
      [
        runtime,
      ]
    );


  // ===================================================
  // ACCEPT INVITATION
  // ===================================================

  const handleAccept =
    useCallback(
      async (
        conversation
      ) => {

        const conversationId =
          normaliseId(
            conversation?.id
          );


        const activeProjectId =
          normaliseId(
            projectId ||
            runtime.get?.(
              "project.id"
            )
          );


        if (
          !conversationId ||
          !activeProjectId ||
          actionConversationIdRef.current
        ) {

          return;

        }


        const participant =
          getParticipantForUser(
            conversation,
            currentUserId
          );


        if (
          participant?.status !==
          "invited"
        ) {

          console.warn(
            "[ConversationList] Conversation is no longer actionable",
            {

              conversationId,

              participantStatus:
                participant?.status,

            }
          );


          await loadConversationList({
            reason:
              "stale-accept",
          });

          return;

        }


        actionConversationIdRef.current =
          conversationId;

        setActionConversationId(
          conversationId
        );

        setError(
          null
        );


        try {

          // -------------------------------------------
          // The existing accept action resolves the
          // conversation from chat.conversationId.
          //
          // Set it first using the established runtime
          // selection contract.
          // -------------------------------------------

          runtime.set?.(
            "chat.conversationId",
            conversationId
          );


          const result =
            await runAction(
              "chat.acceptConversationInvitation",
              {

                conversationId,

                projectId:
                  activeProjectId,

              }
            );


          if (
            result?.ok ===
            false
          ) {

            console.warn(
              "[ConversationList] Accept invitation failed",
              result
            );


            setError(
              result?.error ||
              result?.result?.error ||
              "Failed to accept conversation invitation"
            );


            return result;

          }


          // -------------------------------------------
          // The accept action updates the active chat
          // runtime state. Reload the collection so
          // the participant state is reconciled from
          // the backend as well.
          // -------------------------------------------

          await loadConversationList({
            reason:
              "invitation-accepted",
          });


          return result;

        }
        catch (acceptError) {

          console.error(
            "[ConversationList] Accept invitation failed",
            acceptError
          );


          setError(
            acceptError?.response?.data?.error ||
            acceptError?.response?.data?.message ||
            acceptError?.message ||
            "Failed to accept conversation invitation"
          );


          return {

            ok:
              false,

            error:
              acceptError?.message ||
              "CHAT_ACCEPT_INVITATION_FAILED",

          };

        }
        finally {

          actionConversationIdRef.current =
            null;

          setActionConversationId(
            null
          );

        }

      },
      [
        currentUserId,
        loadConversationList,
        projectId,
        runtime,
        runAction,
      ]
    );


  // ===================================================
  // DECLINE INVITATION
  // ===================================================

  const handleDecline =
    useCallback(
      async (
        conversation
      ) => {

        const conversationId =
          normaliseId(
            conversation?.id
          );


        const activeProjectId =
          normaliseId(
            projectId ||
            runtime.get?.(
              "project.id"
            )
          );


        if (
          !conversationId ||
          !activeProjectId ||
          actionConversationIdRef.current
        ) {

          return;

        }


        const participant =
          getParticipantForUser(
            conversation,
            currentUserId
          );


        if (
          participant?.status !==
          "invited"
        ) {

          console.warn(
            "[ConversationList] Conversation is no longer actionable",
            {

              conversationId,

              participantStatus:
                participant?.status,

            }
          );


          await loadConversationList({
            reason:
              "stale-decline",
          });

          return;

        }


        actionConversationIdRef.current =
          conversationId;

        setActionConversationId(
          conversationId
        );

        setError(
          null
        );


        try {

          runtime.set?.(
            "chat.conversationId",
            conversationId
          );


          const result =
            await runAction(
              "chat.declineConversationInvitation",
              {

                conversationId,

                projectId:
                  activeProjectId,

              }
            );


          if (
            result?.ok ===
            false
          ) {

            console.warn(
              "[ConversationList] Decline invitation failed",
              result
            );


            setError(
              result?.error ||
              result?.result?.error ||
              "Failed to decline conversation invitation"
            );


            return result;

          }


          await loadConversationList({
            reason:
              "invitation-declined",
          });


          return result;

        }
        catch (declineError) {

          console.error(
            "[ConversationList] Decline invitation failed",
            declineError
          );


          setError(
            declineError?.response?.data?.error ||
            declineError?.response?.data?.message ||
            declineError?.message ||
            "Failed to decline conversation invitation"
          );


          return {

            ok:
              false,

            error:
              declineError?.message ||
              "CHAT_DECLINE_INVITATION_FAILED",

          };

        }
        finally {

          actionConversationIdRef.current =
            null;

          setActionConversationId(
            null
          );

        }

      },
      [
        currentUserId,
        loadConversationList,
        projectId,
        runtime,
        runAction,
      ]
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        width:
          "100%",

        boxSizing:
          "border-box",

        padding:
          12,

        border:
          "1px solid #2a2a2a",

        borderRadius:
          10,

        background:
          "#111",

        color:
          "#fff",

        fontSize:
          12,

      }}
    >

      {/* ============================================= */}
      {/* HEADER                                        */}
      {/* ============================================= */}

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          marginBottom:
            10,

        }}
      >

        <div
          style={{
            fontSize:
              14,

            fontWeight:
              700,

          }}
        >

          {title}

        </div>


        {loading && (

          <div
            style={{
              color:
                "#94a3b8",

              fontSize:
                11,

            }}
          >

            Loading...

          </div>

        )}

      </div>


      {/* ============================================= */}
      {/* ERROR                                         */}
      {/* ============================================= */}

      {error && (

        <div
          style={{
            marginBottom:
              10,

            padding:
              "8px 10px",

            border:
              "1px solid #7f1d1d",

            borderRadius:
              7,

            background:
              "#2a1111",

            color:
              "#fca5a5",

            fontSize:
              11,

          }}
        >

          {error}

        </div>

      )}


      {/* ============================================= */}
      {/* NO CURRENT USER                               */}
      {/* ============================================= */}

      {!currentUserId && (

        <div
          style={{
            color:
              "#94a3b8",

            fontSize:
              11,

          }}
        >

          Unable to identify the current user.

        </div>

      )}


      {/* ============================================= */}
      {/* EMPTY                                         */}
      {/* ============================================= */}

      {currentUserId &&
        conversations.length === 0 && (

        <div
          style={{
            padding:
              "8px 0",

            color:
              "#94a3b8",

            fontSize:
              11,

          }}
        >

          {loading
            ? "Loading conversations..."
            : emptyText}

        </div>

      )}


      {/* ============================================= */}
      {/* CONVERSATIONS                                 */}
      {/* ============================================= */}

      {conversations.length > 0 && (

        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              7,

          }}
        >

          {conversations.map(
            conversation => {

              const conversationId =
                normaliseId(
                  conversation?.id
                );

              const participant =
                conversation?.participant;

              const participantStatus =
                participant?.status;

              const invited =
                participantStatus ===
                "invited";

              const selected =
                conversationId ===
                selectedId;

              const busy =
                actionConversationId ===
                conversationId;


              return (

                <div
                  key={
                    conversationId
                  }

                  style={{
                    padding:
                      10,

                    border:
                      selected
                        ? "1px solid #2563eb"
                        : invited
                          ? "1px solid #7c3aed"
                          : "1px solid #2a2a2a",

                    borderRadius:
                      8,

                    background:
                      selected
                        ? "#101a33"
                        : invited
                          ? "#1a1228"
                          : "#151515",

                  }}
                >

                  <button
                    type="button"

                    onClick={() =>
                      handleSelect(
                        conversation
                      )
                    }

                    style={{
                      display:
                        "block",

                      width:
                        "100%",

                      padding:
                        0,

                      border:
                        "none",

                      background:
                        "transparent",

                      color:
                        "#fff",

                      textAlign:
                        "left",

                      cursor:
                        "pointer",

                    }}
                  >

                    <div
                      style={{
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

                      <span
                        style={{
                          fontWeight:
                            700,

                          fontSize:
                            12,

                        }}
                      >

                        {getConversationTitle(
                          conversation
                        )}

                      </span>


                      <span
                        style={{
                          flexShrink:
                            0,

                          fontSize:
                            10,

                          color:
                            invited
                              ? "#c4b5fd"
                              : selected
                                ? "#93c5fd"
                                : "#94a3b8",

                        }}
                      >

                        {invited
                          ? "Invitation"
                          : selected
                            ? "Selected"
                            : "Open"}

                      </span>

                    </div>


                    {invited && (

                      <div
                        style={{
                          marginTop:
                            5,

                          color:
                            "#cbd5e1",

                          fontSize:
                            11,

                        }}
                      >

                        {getParticipantName(
                          participant
                        )}{" "}
                        invited you to this
                        conversation.

                      </div>

                    )}

                  </button>


                  {/* ================================= */}
                  {/* INVITATION ACTIONS                 */}
                  {/* ================================= */}

                  {invited && (

                    <div
                      style={{
                        display:
                          "flex",

                        gap:
                          7,

                        marginTop:
                          9,

                      }}
                    >

                      <button
                        type="button"

                        onClick={() =>
                          handleAccept(
                            conversation
                          )
                        }

                        disabled={
                          !!actionConversationId
                        }

                        style={{
                          flex:
                            1,

                          padding:
                            "7px 9px",

                          border:
                            "none",

                          borderRadius:
                            6,

                          background:
                            busy
                              ? "#334155"
                              : "#2563eb",

                          color:
                            "#fff",

                          fontSize:
                            11,

                          fontWeight:
                            600,

                          cursor:
                            busy
                              ? "default"
                              : "pointer",

                        }}
                      >

                        {busy
                          ? "Accepting..."
                          : "Accept"}

                      </button>


                      <button
                        type="button"

                        onClick={() =>
                          handleDecline(
                            conversation
                          )
                        }

                        disabled={
                          !!actionConversationId
                        }

                        style={{
                          flex:
                            1,

                          padding:
                            "7px 9px",

                          border:
                            "1px solid #444",

                          borderRadius:
                            6,

                          background:
                            "#181818",

                          color:
                            "#cbd5e1",

                          fontSize:
                            11,

                          fontWeight:
                            600,

                          cursor:
                            actionConversationId
                              ? "default"
                              : "pointer",

                        }}
                      >

                        Decline

                      </button>

                    </div>

                  )}

                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}
