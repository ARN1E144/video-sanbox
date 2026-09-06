import jwt from "jsonwebtoken";

import Call from "../models/call.js";

import TrainingSession from "../models/TrainingSession.js";
import TrainingParticipant from "../models/TrainingParticipant.js";

import {
  applyGroupCallParticipantLeave,
} from "../services/groupCallLifecycle.js";


// =====================================================
// GROUP CALL / TRAINING SOCKET
// =====================================================
//
// Shared Socket.IO transport for:
//
//   - Group Calls
//   - Remote Training
//
// IMPORTANT:
//
// The database lifecycle remains owned by the relevant
// HTTP/domain layer.
//
// This module owns:
//
//   - socket authentication
//   - realtime signalling
//   - socket -> user association
//   - authenticated user-room membership
//   - group-call room membership
//   - training-session room membership
//   - unexpected Group Call disconnect lifecycle
//
// It does NOT own:
//
//   - Agora media
//   - HTTP responses
//   - Group Call lifecycle rules
//   - Training Session lifecycle rules
//
// =====================================================


// =====================================================
// AUTHENTICATE SOCKET
// =====================================================

function authenticateSocket(
  socket
) {

  const token =
    socket.handshake?.auth?.token;


  if (
    !token
  ) {

    throw new Error(
      "AUTH_REQUIRED"
    );

  }


  const payload =
    jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );


  if (
    !payload?.userId ||
    !payload?.tenantId
  ) {

    throw new Error(
      "INVALID_AUTH_TOKEN"
    );

  }


  return payload;

}


// =====================================================
// NORMALISE ID
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


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


// =====================================================
// GROUP CALL ROOM
// =====================================================

function getGroupCallRoom(
  callId
) {

  return (
    `group-call:${String(
      callId
    )}`
  );

}


// =====================================================
// TRAINING ROOM
// =====================================================

function getTrainingRoom(
  sessionId
) {

  return (
    `training-session:${String(
      sessionId
    )}`
  );

}


// =====================================================
// USER ROOM
// =====================================================
//
// Every authenticated socket joins:
//
//   user:<userId>
//
// This room is used by the HTTP/domain layers to send
// realtime events directly to a specific authenticated
// user.
//
// Examples:
//
//   group-call invitations
//   training invitations
//   training started notifications
//   training ended notifications
//
// This is intentionally separate from:
//
//   group-call:<callId>
//   training-session:<sessionId>
//
// =====================================================

function getUserRoom(
  userId
) {

  return (
    `user:${String(
      userId
    )}`
  );

}


// =====================================================
// FIND GROUP CALL PARTICIPANT
// =====================================================

function findGroupCallParticipant(
  call,
  userId
) {

  return (
    call?.participants?.find(
      participant =>
        String(
          participant.userId
        ) ===
        String(
          userId
        )
    ) ||
    null
  );

}


// =====================================================
// FIND TRAINING PARTICIPANT
// =====================================================

async function findTrainingParticipant({
  sessionId,
  tenantId,
  userId,
}) {

  return TrainingParticipant.findOne({

    sessionId,

    tenantId,

    userId,

  });

}


// =====================================================
// JOIN TRAINING SESSION ROOM
// =====================================================
//
// This is intentionally independent from Group Call.
//
// A training participant may join the socket room when:
//
//   invited
//   joined
//
// Socket membership does NOT change database state.
//
// =====================================================

async function handleTrainingJoin(
  namespace,
  socket,
  sessionId
) {

  const id =
    normaliseId(
      sessionId
    );


  if (
    !id
  ) {

    console.warn(
      "[GroupCallSocket] training-session:join missing sessionId",
      {
        socketId:
          socket.id,
      }
    );


    return;

  }


  try {

    // ===============================================
    // FIND SESSION
    // ===============================================

    const session =
      await TrainingSession.findOne({

        _id:
          id,

        tenantId:
          socket.user.tenantId,

      });


    if (
      !session
    ) {

      console.warn(
        "[GroupCallSocket] training session not found",
        {

          sessionId:
            id,

          userId:
            socket.user.userId,

        }
      );


      return;

    }


    // ===============================================
    // FIND PARTICIPANT
    // ===============================================

    const participant =
      await findTrainingParticipant({

        sessionId:
          session._id,

        tenantId:
          socket.user.tenantId,

        userId:
          socket.user.userId,

      });


    if (
      !participant
    ) {

      console.warn(
        "[GroupCallSocket] training user is not a participant",
        {

          sessionId:
            id,

          userId:
            socket.user.userId,

        }
      );


      return;

    }


    // ===============================================
    // ONLY VALID TRAINING PARTICIPANTS
    // ===============================================

    if (
      ![
        "invited",
        "joined",
      ].includes(
        participant.status
      )
    ) {

      console.warn(
        "[GroupCallSocket] training participant not eligible for room",
        {

          sessionId:
            id,

          userId:
            socket.user.userId,

          status:
            participant.status,

        }
      );


      return;

    }


    // ===============================================
    // SESSION MUST STILL EXIST
    // ===============================================

    if (
      session.status ===
        "ended"
    ) {

      console.warn(
        "[GroupCallSocket] training session already ended",
        {

          sessionId:
            id,

        }
      );


      return;

    }


    // ===============================================
    // JOIN SOCKET ROOM
    // ===============================================

    const room =
      getTrainingRoom(
        id
      );


    await socket.join(
      room
    );


    // ===============================================
    // STORE SOCKET STATE
    // ===============================================

    socket.data.trainingSessionId =
      id;

    socket.data.trainingUserId =
      String(
        socket.user.userId
      );

    socket.data.trainingTenantId =
      String(
        socket.user.tenantId
      );


    console.log(
      "[GroupCallSocket] joined training session room",
      {

        socketId:
          socket.id,

        sessionId:
          id,

        userId:
          socket.data.trainingUserId,

        room,

        participantStatus:
          participant.status,

      }
    );


    socket.emit(
      "training-session:joined",
      {

        sessionId:
          id,

      }
    );

  }
  catch (error) {

    console.error(
      "[GroupCallSocket] training-session:join failed",
      {

        sessionId:
          id,

        userId:
          socket.user.userId,

        error,

      }
    );

  }

}


// =====================================================
// LEAVE TRAINING SOCKET ROOM
// =====================================================
//
// This does NOT modify MongoDB participant state.
//
// The HTTP training leave route remains authoritative.
//
// =====================================================

async function handleTrainingLeaveRoom(
  socket,
  sessionId = null
) {

  const id =
    normaliseId(
      sessionId ||
      socket.data?.trainingSessionId
    );


  if (
    !id
  ) {

    return;

  }


  const room =
    getTrainingRoom(
      id
    );


  try {

    await socket.leave(
      room
    );

  }
  catch (error) {

    console.warn(
      "[GroupCallSocket] training leave room failed",
      {

        sessionId:
          id,

        socketId:
          socket.id,

        error,

      }
    );

  }


  if (
    socket.data?.trainingSessionId ===
    id
  ) {

    socket.data.trainingSessionId =
      null;

  }


  console.log(
    "[GroupCallSocket] left training session room",
    {

      socketId:
        socket.id,

      sessionId:
        id,

      userId:
        socket.data?.trainingUserId,

    }
  );

}


// =====================================================
// REGISTER
// =====================================================

export function registerGroupCallSockets(
  io
) {

  const namespace =
    io.of(
      "/group-calls"
    );


  // ===================================================
  // AUTH MIDDLEWARE
  // ===================================================

  namespace.use(
    (
      socket,
      next
    ) => {

      try {

        socket.user =
          authenticateSocket(
            socket
          );


        next();

      }
      catch (error) {

        console.error(
          "[GroupCallSocket] authentication failed",
          {

            socketId:
              socket.id,

            error:
              error?.message,

          }
        );


        next(
          new Error(
            "UNAUTHORIZED"
          )
        );

      }

    }
  );


  // ===================================================
  // CONNECTION
  // ===================================================

  namespace.on(
    "connection",
    async socket => {

      // -----------------------------------------------
      // INITIAL SOCKET STATE
      // -----------------------------------------------

      socket.data.callId =
        null;

      socket.data.userId =
        String(
          socket.user.userId
        );

      socket.data.tenantId =
        String(
          socket.user.tenantId
        );

      socket.data.trainingSessionId =
        null;

      socket.data.trainingUserId =
        String(
          socket.user.userId
        );

      socket.data.trainingTenantId =
        String(
          socket.user.tenantId
        );


      // =================================================
      // AUTHENTICATED USER ROOM
      // =================================================
      //
      // Every authenticated socket joins its own private
      // user room immediately after authentication.
      //
      // This is what allows backend routes to target:
      //
      //   user:<userId>
      //
      // without requiring the socket to already be inside
      // a specific call/training room.
      //
      // This is especially important for invitations,
      // because an invited user may not yet have joined
      // the group-call/training room.
      //
      // =================================================

      const userRoom =
        getUserRoom(
          socket.user.userId
        );


      try {

        await socket.join(
          userRoom
        );


        console.log(
          "[GroupCallSocket] joined authenticated user room",
          {

            socketId:
              socket.id,

            userId:
              String(
                socket.user.userId
              ),

            tenantId:
              String(
                socket.user.tenantId
              ),

            room:
              userRoom,

          }
        );

      }
      catch (error) {

        console.error(
          "[GroupCallSocket] failed to join authenticated user room",
          {

            socketId:
              socket.id,

            userId:
              String(
                socket.user.userId
              ),

            room:
              userRoom,

            error,

          }
        );

      }


      console.log(
        "[GroupCallSocket] connected",
        {

          socketId:
            socket.id,

          userId:
            String(
              socket.user.userId
            ),

          tenantId:
            String(
              socket.user.tenantId
            ),

        }
      );


      // =================================================
      // GROUP CALL JOIN
      // =================================================

      socket.on(
        "group-call:join",
        async payload => {

          try {

            const callId =
              normaliseId(
                payload?.callId
              );


            if (
              !callId
            ) {

              console.warn(
                "[GroupCallSocket] group-call:join missing callId",
                {

                  socketId:
                    socket.id,

                }
              );


              return;

            }


            // =========================================
            // FIND CALL
            // =========================================

            const call =
              await Call.findOne({

                _id:
                  callId,

                tenantId:
                  socket.user.tenantId,

                type:
                  "group",

              });


            if (
              !call
            ) {

              console.warn(
                "[GroupCallSocket] group call not found",
                {

                  callId,

                  userId:
                    socket.user.userId,

                }
              );


              return;

            }


            // =========================================
            // VERIFY PARTICIPANT
            // =========================================

            const participant =
              findGroupCallParticipant(
                call,
                socket.user.userId
              );


            if (
              !participant
            ) {

              console.warn(
                "[GroupCallSocket] user is not a participant",
                {

                  callId,

                  userId:
                    socket.user.userId,

                }
              );


              return;

            }


            // =========================================
            // ACTIVE PARTICIPANT ONLY
            // =========================================

            if (
              ![
                "accepted",
                "joined",
              ].includes(
                participant.status
              )
            ) {

              console.warn(
                "[GroupCallSocket] participant not active",
                {

                  callId,

                  userId:
                    socket.user.userId,

                  status:
                    participant.status,

                }
              );


              return;

            }


            // =========================================
            // JOIN ROOM
            // =========================================

            const room =
              getGroupCallRoom(
                callId
              );


            await socket.join(
              room
            );


            // =========================================
            // STORE SOCKET STATE
            // =========================================

            socket.data.callId =
              callId;

            socket.data.userId =
              String(
                socket.user.userId
              );

            socket.data.tenantId =
              String(
                socket.user.tenantId
              );


            console.log(
              "[GroupCallSocket] joined call room",
              {

                socketId:
                  socket.id,

                callId,

                userId:
                  socket.data.userId,

                room,

              }
            );


            socket.emit(
              "group-call:joined",
              {

                callId,

              }
            );

          }
          catch (error) {

            console.error(
              "[GroupCallSocket] group-call:join failed",
              error
            );

          }

        }
      );


      // =================================================
      // TRAINING SESSION JOIN
      // =================================================
      //
      // This does not alter TrainingParticipant state.
      //
      // It only associates the socket with the training
      // session realtime room.
      //
      // =================================================

      socket.on(
        "training-session:join",
        async payload => {

          await handleTrainingJoin(
            namespace,
            socket,
            payload?.sessionId
          );

        }
      );


      // =================================================
      // GROUP CALL LEAVE ROOM
      // =================================================

      socket.on(
        "group-call:leave-room",
        async payload => {

          const callId =
            normaliseId(
              payload?.callId ||
              socket.data?.callId
            );


          if (
            !callId
          ) {

            return;

          }


          const room =
            getGroupCallRoom(
              callId
            );


          try {

            await socket.leave(
              room
            );

          }
          catch (error) {

            console.warn(
              "[GroupCallSocket] leave room failed",
              {

                callId,

                socketId:
                  socket.id,

                error,

              }
            );

          }


          if (
            socket.data?.callId ===
            callId
          ) {

            socket.data.callId =
              null;

          }


          console.log(
            "[GroupCallSocket] left call room",
            {

              socketId:
                socket.id,

              callId,

              userId:
                socket.data?.userId,

            }
          );

        }
      );


      // =================================================
      // TRAINING LEAVE ROOM
      // =================================================

      socket.on(
        "training-session:leave-room",
        async payload => {

          await handleTrainingLeaveRoom(
            socket,
            payload?.sessionId
          );

        }
      );


      // =================================================
      // DISCONNECT
      // =================================================
      //
      // Group Call:
      //   disconnect applies the shared lifecycle.
      //
      // Training:
      //   disconnect marks a joined participant as left.
      //
      // IMPORTANT:
      //
      // REST leave/end remains authoritative for explicit
      // user actions. This path handles unexpected browser
      // disconnects.
      //
      // =================================================

      socket.on(
        "disconnect",
        async (
          reason
        ) => {

          const callId =
            socket.data?.callId;


          const trainingSessionId =
            socket.data?.trainingSessionId;


          const userId =
            socket.data?.userId;


          // =============================================
          // NO ACTIVE SESSION
          // =============================================

          if (
            !callId &&
            !trainingSessionId
          ) {

            console.log(
              "[GroupCallSocket] disconnected with no active call/session",
              {

                socketId:
                  socket.id,

                reason,

              }
            );


            return;

          }


          // =============================================
          // GROUP CALL DISCONNECT
          // =============================================

          if (
            callId &&
            userId
          ) {

            console.log(
              "[GroupCallSocket] unexpected group call disconnect",
              {

                socketId:
                  socket.id,

                callId,

                userId,

                reason,

              }
            );


            try {

              const call =
                await Call.findOne({

                  _id:
                    callId,

                  tenantId:
                    socket.data.tenantId,

                  type:
                    "group",

                });


              if (
                !call
              ) {

                console.log(
                  "[GroupCallSocket] call no longer exists",
                  {
                    callId,
                  }
                );

              }
              else {

                const lifecycle =
                  applyGroupCallParticipantLeave(

                    call,

                    userId,

                    {

                      reason:
                        "socket-disconnected",

                    }

                  );


                if (
                  lifecycle.ok
                ) {

                  await call.save();


                  const room =
                    getGroupCallRoom(
                      callId
                    );


                  if (
                    lifecycle.callEnded
                  ) {

                    namespace
                      .to(
                        room
                      )
                      .emit(
                        "group-call:ended",
                        {

                          callId,

                          reason:
                            lifecycle.isHost
                              ? "host-disconnected"
                              : "no-participants",

                          endedBy:
                            userId,

                          endedAt:
                            lifecycle.timestamp,

                        }
                      );


                    console.log(
                      "[GroupCallSocket] GROUP_CALL_ENDED",
                      {

                        callId,

                        userId,

                        reason:
                          lifecycle.isHost
                            ? "host-disconnected"
                            : "no-participants",

                      }
                    );

                  }
                  else {

                    namespace
                      .to(
                        room
                      )
                      .emit(
                        "group-call:participant-left",
                        {

                          callId,

                          userId,

                          leftAt:
                            lifecycle.timestamp,

                        }
                      );


                    console.log(
                      "[GroupCallSocket] GROUP_CALL_PARTICIPANT_LEFT",
                      {

                        callId,

                        userId,

                      }
                    );

                  }

                }
                else {

                  console.warn(
                    "[GroupCallSocket] group lifecycle failed",
                    {

                      callId,

                      userId,

                      lifecycle,

                    }
                  );

                }

              }

            }
            catch (error) {

              console.error(
                "[GroupCallSocket] group disconnect lifecycle failed",
                {

                  callId,

                  userId,

                  error,

                }
              );

            }

          }


          // =============================================
          // TRAINING DISCONNECT
          // =============================================

          if (
            trainingSessionId &&
            userId
          ) {

            console.log(
              "[GroupCallSocket] unexpected training session disconnect",
              {

                socketId:
                  socket.id,

                sessionId:
                  trainingSessionId,

                userId,

                reason,

              }
            );


            try {

              const session =
                await TrainingSession.findOne({

                  _id:
                    trainingSessionId,

                  tenantId:
                    socket.data.trainingTenantId,

                });


              if (
                !session
              ) {

                console.log(
                  "[GroupCallSocket] training session no longer exists",
                  {

                    sessionId:
                      trainingSessionId,

                  }
                );

              }
              else if (
                session.status ===
                "ended"
              ) {

                console.log(
                  "[GroupCallSocket] training session already ended",
                  {

                    sessionId:
                      trainingSessionId,

                  }
                );

              }
              else {

                const participant =
                  await TrainingParticipant.findOne({

                    sessionId:
                      session._id,

                    tenantId:
                      socket.data.trainingTenantId,

                    userId,

                  });


                if (
                  participant &&
                  participant.status ===
                    "joined"
                ) {

                  participant.status =
                    "left";

                  participant.leftAt =
                    new Date();


                  await participant.save();


                  // ------------------------------------
                  // Broadcast participant departure
                  // ------------------------------------

                  namespace
                    .to(
                      getTrainingRoom(
                        trainingSessionId
                      )
                    )
                    .emit(
                      "training-session:participant-left",
                      {

                        sessionId:
                          trainingSessionId,

                        userId,

                        leftAt:
                          participant.leftAt,

                      }
                    );


                  console.log(
                    "[GroupCallSocket] TRAINING_PARTICIPANT_LEFT",
                    {

                      sessionId:
                        trainingSessionId,

                      userId,

                    }
                  );

                }

              }

            }
            catch (error) {

              console.error(
                "[GroupCallSocket] training disconnect lifecycle failed",
                {

                  sessionId:
                    trainingSessionId,

                  userId,

                  error,

                }
              );

            }

          }

        }
      );

    }
  );


  // ===================================================
  // TRAINING REALTIME EVENTS
  // ===================================================
  //
  // These are helpers for the HTTP training routes.
  //
  // The routes can obtain the namespace with:
  //
  //   req.app.get("io").of("/group-calls")
  //
  // and emit:
  //
  //   training-session:invited
  //   training-session:started
  //   training-session:ended
  //
  // The client runtime filters them by session/user.
  //
  // ===================================================

  console.log(
    "[GroupCallSocket] namespace registered"
  );


  return namespace;

}