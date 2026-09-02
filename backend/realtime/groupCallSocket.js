// backend/realtime/groupCallSocket.js

import jwt from "jsonwebtoken";

import Call from "../models/call.js";

import {
  applyGroupCallParticipantLeave,
} from "../services/groupCallLifecycle.js";


// =====================================================
// GROUP CALL SOCKET
// =====================================================
//
// Responsibilities:
//
//   - authenticate Socket.IO connections
//   - associate socket -> user
//   - associate socket -> group call
//   - detect unexpected disconnects
//   - apply shared participant lifecycle
//   - broadcast lifecycle events
//
// The shared lifecycle helper owns the database rules.
//
// This module owns realtime signalling only.
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
// ROOM
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
    socket => {

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
      //
      // Called by the client after it has successfully
      // joined the application-level group call.
      //
      // =================================================

      socket.on(
        "group-call:join",
        async payload => {

          try {

            const callId =
              String(
                payload?.callId ||
                ""
              ).trim();


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
              call.participants?.find(
                item =>
                  String(
                    item.userId
                  ) ===
                  String(
                    socket.user.userId
                  )
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
            // ONLY ACCEPTED/JOINED USERS
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
            //
            // This is deliberately kept on socket.data
            // rather than in RuntimeState.
            //
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


            // =========================================
            // OPTIONAL ACK
            // =========================================

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
      // LEAVE ROOM EXPLICITLY
      // =================================================
      //
      // This is useful when the frontend has already
      // performed the HTTP leave lifecycle.
      //
      // We only leave the Socket.IO room here.
      //
      // The HTTP /leave route remains the application
      // lifecycle authority for explicit leaves.
      //
      // =================================================

      socket.on(
        "group-call:leave-room",
        async payload => {

          const callId =
            String(
              payload?.callId ||
              socket.data?.callId ||
              ""
            ).trim();


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
      // DISCONNECT
      // =================================================
      //
      // This is the important V1 failure-recovery path.
      //
      // If the browser disappears without explicitly
      // leaving the call, Socket.IO disconnects and we
      // apply the EXACT SAME lifecycle rules as the
      // normal HTTP leave route.
      //
      // =================================================

      socket.on(
        "disconnect",
        async (
          reason
        ) => {

          const callId =
            socket.data?.callId;


          const userId =
            socket.data?.userId;


          if (
            !callId ||
            !userId
          ) {

            console.log(
              "[GroupCallSocket] disconnected with no active call",
              {

                socketId:
                  socket.id,

                reason,

              }
            );


            return;

          }


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

            // =========================================
            // FIND CALL
            // =========================================

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


              return;

            }


            // =========================================
            // APPLY SHARED LIFECYCLE
            // =========================================

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
              !lifecycle.ok
            ) {

              console.warn(
                "[GroupCallSocket] lifecycle failed",
                {

                  callId,

                  userId,

                  lifecycle,

                }
              );


              return;

            }


            // =========================================
            // SAVE
            // =========================================

            await call.save();


            // =========================================
            // ROOM
            // =========================================

            const room =
              getGroupCallRoom(
                callId
              );


            // =========================================
            // WHOLE CALL ENDED
            // =========================================

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

              // =======================================
              // NORMAL PARTICIPANT LEFT
              // =======================================

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
          catch (error) {

            console.error(
              "[GroupCallSocket] disconnect lifecycle failed",
              {

                callId,

                userId,

                error,

              }
            );

          }

        }
      );


    }
  );


  console.log(
    "[GroupCallSocket] namespace registered"
  );


  return namespace;

}


export default registerGroupCallSockets;