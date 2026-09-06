// backend/routes/trainingRoutes.js

import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";

import TrainingSession from "../models/TrainingSession.js";
import TrainingParticipant from "../models/TrainingParticipant.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import requireTenant from "../middleware/requireTenant.js";


const router =
  express.Router();


// =====================================================
// CONSTANTS
// =====================================================

const MAX_SESSION_PARTICIPANTS =
  10000;

const MAX_PENDING_SESSIONS =
  50;


// =====================================================
// HELPERS
// =====================================================

function isValidObjectId(
  value
) {

  return mongoose.isValidObjectId(
    value
  );

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
// TRAINING CHANNEL
// =====================================================

function makeTrainingChannelName({
  tenantId,
  hostUserId,
}) {

  const short =
    crypto
      .randomBytes(6)
      .toString("hex");


  return (
    `training_t_${String(
      tenantId
    ).slice(-6)}` +
    `_u_${String(
      hostUserId
    ).slice(-6)}` +
    `_${short}`
  );

}


// =====================================================
// TRAINING SOCKET NAMESPACE
// =====================================================
//
// Group calls and training share the same Socket.IO
// namespace, but use separate rooms/events.
//
// =====================================================

function getTrainingNamespace(
  req
) {

  const io =
    req.app?.get?.(
      "io"
    );


  if (
    !io
  ) {

    return null;

  }


  return io.of(
    "/group-calls"
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
// Used for invitations.
//
// Every authenticated socket joins:
//
//   user:<userId>
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
// LOAD MEMBERSHIP
// =====================================================

async function loadMembership(
  req
) {

  return Membership.findOne({

    userId:
      req.user.userId,

    tenantId:
      req.user.tenantId,

  });

}


// =====================================================
// SERIALISE SESSION
// =====================================================

function serialiseSession(
  session
) {

  return {

    id:
      normaliseId(
        session?._id ||
        session?.id
      ),

    tenantId:
      normaliseId(
        session?.tenantId
      ),

    hostUserId:
      normaliseId(
        session?.hostUserId
      ),

    channelName:
      session?.channelName ||
      null,

    status:
      session?.status ||
      null,

    createdAt:
      session?.createdAt ||
      null,

    startedAt:
      session?.startedAt ||
      null,

    endedAt:
      session?.endedAt ||
      null,

    invitationExpiresAt:
      session?.invitationExpiresAt ||
      null,

    expiredAt:
      session?.expiredAt ||
      null,

  };

}


// =====================================================
// SERIALISE PARTICIPANT
// =====================================================

function serialiseParticipant(
  participant,
  user = null
) {

  if (
    !participant
  ) {

    return null;

  }


  return {

    id:
      normaliseId(
        participant?._id ||
        participant?.id
      ),

    userId:
      normaliseId(
        participant?.userId
      ),

    sessionId:
      normaliseId(
        participant?.sessionId
      ),

    status:
      participant?.status ||
      null,

    invitedAt:
      participant?.invitedAt ||
      null,

    acceptedAt:
      participant?.acceptedAt ||
      null,

    declinedAt:
      participant?.declinedAt ||
      null,

    joinedAt:
      participant?.joinedAt ||
      null,

    leftAt:
      participant?.leftAt ||
      null,

    user:
      user
        ? {

            id:
              normaliseId(
                user?._id ||
                user?.id
              ),

            firstName:
              user?.firstName ||
              "",

            lastName:
              user?.lastName ||
              "",

            email:
              user?.email ||
              "",

          }
        : undefined,

  };

}


// =====================================================
// EMIT TRAINING INVITATION
// =====================================================
//
// Sends the invitation directly to the intended user.
//
// The TrainingInvitation component then performs an
// authoritative REST refresh.
//
// Polling remains as fallback.
//
// =====================================================

function emitTrainingInvitation(
  namespace,
  {
    session,
    participant,
    hostUserId,
  }
) {

  if (
    !namespace ||
    !session ||
    !participant
  ) {

    return false;

  }


  const sessionId =
    normaliseId(
      session?._id ||
      session?.id
    );


  const userId =
    normaliseId(
      participant?.userId
    );


  if (
    !sessionId ||
    !userId
  ) {

    return false;

  }


  const payload = {

    sessionId,

    userId,

    invitedBy:
      normaliseId(
        hostUserId
      ),

    reason:
      "session-created",

  };


  namespace
    .to(
      getUserRoom(
        userId
      )
    )
    .emit(
      "training-session:invited",
      payload
    );


  console.log(
    "[Training] TRAINING_SESSION_INVITED emitted",
    {

      ...payload,

      room:
        getUserRoom(
          userId
        ),

    }
  );


  return true;

}


// =====================================================
// CREATE TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions
//
// Creates:
//
//   TrainingSession
//   TrainingParticipant[]
//
// Initial session state:
//
//   inviting
//
// No Agora work occurs here.
//
// =====================================================

router.post(
  "/sessions",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const hostUserId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      // =================================================
      // HOST MEMBERSHIP
      // =================================================

      const hostMembership =
        await loadMembership(
          req
        );


      if (
        !hostMembership
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "HOST_NOT_TENANT_MEMBER",

            message:
              "Host is not a member of this tenant.",

          });

      }


      // =================================================
      // INPUT
      // =================================================

      const rawParticipantIds =
        Array.isArray(
          req.body?.participantIds
        )
          ? req.body.participantIds
          : [];


      // =================================================
      // NORMALISE
      // =================================================

      const participantIds = [
        ...new Set(

          rawParticipantIds

            .map(
              normaliseId
            )

            .filter(Boolean)

        ),
      ];


      // =================================================
      // REQUIRE PARTICIPANTS
      // =================================================

      if (
        participantIds.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANTS_REQUIRED",

            message:
              "At least one participant is required.",

          });

      }


      // =================================================
      // SIZE
      // =================================================

      if (
        participantIds.length >
        MAX_SESSION_PARTICIPANTS
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANT_LIMIT_EXCEEDED",

            message:
              `A maximum of ${MAX_SESSION_PARTICIPANTS} participants is allowed.`,

          });

      }


      // =================================================
      // OBJECT IDS
      // =================================================

      const invalidParticipantIds =
        participantIds.filter(
          id =>
            !isValidObjectId(
              id
            )
        );


      if (
        invalidParticipantIds.length >
        0
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "INVALID_TRAINING_PARTICIPANT_IDS",

            invalidParticipantIds,

          });

      }


      // =================================================
      // HOST CANNOT BE PARTICIPANT
      // =================================================

      if (
        participantIds.some(
          id =>
            id ===
            hostUserId
        )
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "TRAINING_HOST_SELECTED",

            message:
              "The host cannot be selected as a training participant.",

          });

      }


      const participantObjectIds =
        participantIds.map(
          id =>
            new mongoose.Types.ObjectId(
              id
            )
        );


      // =================================================
      // VERIFY TENANT MEMBERSHIP
      // =================================================

      const memberships =
        await Membership.find({

          tenantId,

          userId: {
            $in:
              participantObjectIds,
          },

        })
          .select(
            "userId role"
          )
          .lean();


      const membershipMap =
        new Map(

          memberships.map(
            membership => [

              normaliseId(
                membership.userId
              ),

              membership,

            ]
          )

        );


      const missingMembershipIds =
        participantIds.filter(
          participantId =>
            !membershipMap.has(
              participantId
            )
        );


      if (
        missingMembershipIds.length >
        0
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANT_NOT_TENANT_MEMBER",

            participantIds:
              missingMembershipIds,

          });

      }


      // =================================================
      // LOAD USERS
      // =================================================

      const users =
        await User.find({

          _id: {
            $in:
              participantObjectIds,
          },

        })
          .select(
            "_id firstName lastName email"
          )
          .lean();


      const userMap =
        new Map(

          users.map(
            user => [

              normaliseId(
                user._id
              ),

              user,

            ]
          )

        );


      const missingUserIds =
        participantIds.filter(
          participantId =>
            !userMap.has(
              participantId
            )
        );


      if (
        missingUserIds.length >
        0
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            error:
              "TRAINING_USERS_NOT_FOUND",

            participantIds:
              missingUserIds,

          });

      }


      // =================================================
      // CHANNEL
      // =================================================

      const channelName =
        makeTrainingChannelName({

          tenantId,

          hostUserId,

        });


      // =================================================
      // CREATE SESSION
      // =================================================

      const session =
        await TrainingSession.create({

          tenantId,

          hostUserId,

          channelName,

          status:
            "inviting",

        });


      // =================================================
      // PARTICIPANTS
      // =================================================

      const invitedAt =
        new Date();


      const participantDocuments =
        participantIds.map(
          participantId => ({

            sessionId:
              session._id,

            tenantId,

            userId:
              new mongoose.Types.ObjectId(
                participantId
              ),

            status:
              "invited",

            invitedAt,

          })
        );


      let participants = [];


      try {

        participants =
          await TrainingParticipant.insertMany(
            participantDocuments,
            {
              ordered:
                true,
            }
          );

      }
      catch (
        participantError
      ) {

        await TrainingSession.deleteOne({

          _id:
            session._id,

        });


        throw participantError;

      }


      // =================================================
      // REALTIME INVITATIONS
      // =================================================

      const namespace =
        getTrainingNamespace(
          req
        );


      if (
        namespace
      ) {

        participants.forEach(
          participant => {

            emitTrainingInvitation(
              namespace,
              {

                session,

                participant,

                hostUserId,

              }
            );

          }
        );

      }
      else {

        console.warn(
          "[Training] Socket.IO namespace unavailable while creating invitations"
        );

      }


      // =================================================
      // RESPONSE
      // =================================================

      const serialisedParticipants =
        participants.map(
          participant => {

            const user =
              userMap.get(
                normaliseId(
                  participant.userId
                )
              );


            return serialiseParticipant(
              participant,
              user
            );

          }
        );


      console.log(
        "[Training] Session created",
        {

          sessionId:
            normaliseId(
              session._id
            ),

          hostUserId,

          channelName,

          participantCount:
            participants.length,

          status:
            session.status,

        }
      );


      return res
        .status(201)
        .json({

          ok:
            true,

          session:
            serialiseSession(
              session
            ),

          participants:
            serialisedParticipants,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] Create training session failed",
        error
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_SESSION_CREATE_FAILED",

          message:
            "Failed to create training session.",

        });

    }

  }
);


// =====================================================
// GET PENDING TRAINING SESSIONS
// =====================================================
//
// GET /api/training/sessions/pending
//
// IMPORTANT:
//
// This returns ONLY actionable invitations.
//
// It does not modify:
//
//   training.sessionId
//
// It does not return:
//
//   joined
//   left
//   ended
//
// =====================================================

router.get(
  "/sessions/pending",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const userId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      // =================================================
      // INVITED PARTICIPANT RECORDS
      // =================================================

      const participantRecords =
        await TrainingParticipant.find({

          tenantId,

          userId,

          status:
            "invited",

        })
          .sort({
            createdAt:
              -1,
          })
          .limit(
            MAX_PENDING_SESSIONS
          )
          .lean();


      if (
        participantRecords.length ===
        0
      ) {

        return res.json({

          ok:
            true,

          sessions:
            [],

        });

      }


      // =================================================
      // SESSION IDS
      // =================================================

      const sessionIds =
        participantRecords.map(
          participant =>
            participant.sessionId
        );


      // =================================================
      // ACTIVE/PENDING SESSIONS ONLY
      // =================================================

      const sessions =
        await TrainingSession.find({

          _id: {
            $in:
              sessionIds,
          },

          tenantId,

          status: {
            $in: [
              "inviting",
              "active",
            ],
          },

        })
          .sort({
            createdAt:
              -1,
          })
          .lean();


      if (
        sessions.length ===
        0
      ) {

        return res.json({

          ok:
            true,

          sessions:
            [],

        });

      }


      // =================================================
      // HOSTS
      // =================================================

      const hostIds = [
        ...new Set(

          sessions
            .map(
              session =>
                normaliseId(
                  session.hostUserId
                )
            )
            .filter(Boolean)

        ),
      ];


      const hosts =
        await User.find({

          _id: {
            $in:
              hostIds,
          },

        })
          .select(
            "_id firstName lastName email"
          )
          .lean();


      const hostMap =
        new Map(

          hosts.map(
            host => [

              normaliseId(
                host._id
              ),

              host,

            ]
          )

        );


      // =================================================
      // PARTICIPANT MAP
      // =================================================

      const participantMap =
        new Map(

          participantRecords.map(
            participant => [

              normaliseId(
                participant.sessionId
              ),

              participant,

            ]
          )

        );


      // =================================================
      // ENRICH
      // =================================================

      const enrichedSessions =
        sessions.map(
          session => {

            const sessionId =
              normaliseId(
                session._id
              );


            const participant =
              participantMap.get(
                sessionId
              );


            const host =
              hostMap.get(
                normaliseId(
                  session.hostUserId
                )
              ) ||
              null;


            return {

              ...serialiseSession(
                session
              ),

              participant:
                serialiseParticipant(
                  participant
                ),

              host:
                host
                  ? {

                      id:
                        normaliseId(
                          host._id
                        ),

                      firstName:
                        host.firstName ||
                        "",

                      lastName:
                        host.lastName ||
                        "",

                      email:
                        host.email ||
                        "",

                    }
                  : null,

            };

          }
        );


      console.log(
        "[Training] Pending sessions loaded",
        {

          userId,

          count:
            enrichedSessions.length,

        }
      );


      return res.json({

        ok:
          true,

        sessions:
          enrichedSessions,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] Get pending training sessions failed",
        error
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_PENDING_SESSIONS_FAILED",

          message:
            "Failed to load pending training sessions.",

        });

    }

  }
);


// =====================================================
// GET TRAINING SESSION
// =====================================================
//
// GET /api/training/sessions/:sessionId
//
// Authorised for:
//
//   host
//   invited participant
//   joined participant
//   left participant
//
// =====================================================

router.get(
  "/sessions/:sessionId",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const sessionId =
        normaliseId(
          req.params?.sessionId
        );


      const userId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "INVALID_TRAINING_SESSION_ID",

          });

      }


      // =================================================
      // SESSION
      // =================================================

      const session =
        await TrainingSession.findOne({

          _id:
            sessionId,

          tenantId,

        });


      if (
        !session
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_FOUND",

          });

      }


      // =================================================
      // MEMBERSHIP
      // =================================================

      const membership =
        await loadMembership(
          req
        );


      if (
        !membership
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_NOT_TENANT_MEMBER",

          });

      }


      // =================================================
      // AUTHORISATION
      // =================================================

      const isHost =
        normaliseId(
          session.hostUserId
        ) ===
        userId;


      const participant =
        await TrainingParticipant.findOne({

          sessionId:
            session._id,

          tenantId,

          userId,

        })
          .lean();


      if (
        !isHost &&
        !participant
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_ACCESS_DENIED",

          });

      }


      // =================================================
      // RESPONSE
      // =================================================

      return res.json({

        ok:
          true,

        session:
          serialiseSession(
            session
          ),

        participant:
          serialiseParticipant(
            participant
          ),

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] Get training session failed",
        error
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_SESSION_FETCH_FAILED",

          message:
            "Failed to load training session.",

        });

    }

  }
);


// =====================================================
// START TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions/:sessionId/start
//
// Host only.
//
// inviting → active
//
// This route DOES NOT join Agora.
//
// It notifies invited participants that the session
// is now ready.
//
// =====================================================

router.post(
  "/sessions/:sessionId/start",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      // =================================================
      // RESOLVE REQUEST CONTEXT
      // =================================================

      const sessionId =
        normaliseId(
          req.params?.sessionId
        );


      const userId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      // =================================================
      // VALIDATE SESSION ID
      // =================================================

      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "INVALID_TRAINING_SESSION_ID",

          });

      }


      // =================================================
      // LOAD SESSION
      // =================================================

      const session =
        await TrainingSession.findOne({

          _id:
            sessionId,

          tenantId,

        });


      if (
        !session
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_FOUND",

          });

      }


      // =================================================
      // HOST AUTHORISATION
      // =================================================

      if (
        normaliseId(
          session.hostUserId
        ) !==
        userId
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_HOST_ONLY",

          });

      }


      // =================================================
      // ALREADY ACTIVE
      // =================================================
      //
      // Do not change participant records here.
      //
      // They must remain "invited" until each participant
      // actually joins.
      //
      // =================================================

      if (
        session.status ===
        "active"
      ) {

        console.log(
          "[Training] Session already active",
          {

            sessionId,

            hostUserId:
              userId,

          }
        );


        return res.json({

          ok:
            true,

          alreadyStarted:
            true,

          session:
            serialiseSession(
              session
            ),

        });

      }


      // =================================================
      // SESSION MUST BE INVITING
      // =================================================

      if (
        session.status !==
        "inviting"
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_STARTABLE",

            message:
              `Training session cannot be started from status "${session.status}".`,

          });

      }


      // =================================================
      // OPTIONAL EXPIRATION CHECK
      // =================================================
      //
      // An invitation which has already expired cannot
      // subsequently be started.
      //
      // =================================================

      const now =
        new Date();


      if (
        session.invitationExpiresAt &&
        session.invitationExpiresAt <=
        now
      ) {

        session.status =
          "expired";


        session.expiredAt =
          now;


        await session.save();


        console.warn(
          "[Training] Cannot start expired training session",
          {

            sessionId,

            hostUserId:
              userId,

            invitationExpiresAt:
              session.invitationExpiresAt,

          }
        );


        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_INVITATION_EXPIRED",

            message:
              "This training session invitation has expired.",

          });

      }


      // =================================================
      // START SESSION
      // =================================================
      //
      // CRITICAL:
      //
      // Do NOT modify TrainingParticipant.status here.
      //
      // "invited" remains actionable and allows
      // /sessions/pending to return the invitation.
      //
      // =================================================

      session.status =
        "active";


      session.startedAt =
        now;


      session.endedAt =
        null;


      await session.save();


      // =================================================
      // VERIFY INVITED PARTICIPANTS
      // =================================================
      //
      // These are the users who should receive the
      // "training-session:started" realtime event.
      //
      // =================================================

      const invitedParticipants =
        await TrainingParticipant.find({

          sessionId:
            session._id,

          tenantId,

          status:
            "invited",

        })
          .select(
            "userId status"
          )
          .lean();


      // =================================================
      // REALTIME NAMESPACE
      // =================================================

      const namespace =
        getTrainingNamespace(
          req
        );


      if (
        namespace
      ) {

        const payload = {

          sessionId,

          startedBy:
            userId,

          startedAt:
            session.startedAt,

        };


        // ===============================================
        // 1. TRAINING ROOM
        // ===============================================
        //
        // Users already in the room receive the event.
        //
        // ===============================================

        namespace
          .to(
            getTrainingRoom(
              sessionId
            )
          )
          .emit(
            "training-session:started",
            payload
          );


        // ===============================================
        // 2. USER ROOMS
        // ===============================================
        //
        // This is the important path for invited users.
        //
        // They may NOT yet have joined the training room,
        // so notify their dedicated user room.
        //
        // ===============================================

        invitedParticipants.forEach(
          participant => {

            const participantUserId =
              normaliseId(
                participant.userId
              );


            if (
              !participantUserId
            ) {

              return;

            }


            namespace
              .to(
                getUserRoom(
                  participantUserId
                )
              )
              .emit(
                "training-session:started",
                payload
              );

          }
        );


        console.log(
          "[Training] TRAINING_SESSION_STARTED emitted",
          {

            ...payload,

            invitedParticipantCount:
              invitedParticipants.length,

            invitedParticipantIds:
              invitedParticipants.map(
                participant =>
                  normaliseId(
                    participant.userId
                  )
              ),

          }
        );

      }
      else {

        console.warn(
          "[Training] Socket.IO namespace unavailable while starting session",
          {

            sessionId,

          });

      }


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Session started",
        {

          sessionId,

          hostUserId:
            userId,

          channelName:
            session.channelName,

          status:
            session.status,

          invitedParticipantCount:
            invitedParticipants.length,

        }
      );


      return res.json({

        ok:
          true,

        alreadyStarted:
          false,

        session:
          serialiseSession(
            session
          ),

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] Start training session failed",
        {

          sessionId:
            req.params?.sessionId,

          error,

        }
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_SESSION_START_FAILED",

          message:
            "Failed to start training session.",

        });

    }

  }
);


// =====================================================
// END TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions/:sessionId/end
//
// Host only.
//
// active/inviting → ended
//
// Realtime event tells connected participants to:
//
//   leave Agora
//   clear runtime
//   clear stale invitation state
//
// =====================================================

// =====================================================
// END TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions/:sessionId/end
//
// Host only.
//
// Valid transitions:
//
//   active   -> ended
//   inviting -> ended
//
// Also:
//
//   invited participants -> cancelled
//
// Responsibilities:
//
//   - end the TrainingSession
//   - cancel outstanding invitations
//   - notify training room
//   - notify participant user rooms
//   - return cancellationResult to frontend
//
// This route does NOT:
//
//   - leave Agora
//   - manipulate frontend runtime state
//
// Frontend media cleanup remains the responsibility of
// the training end action / Agora lifecycle.
// =====================================================

router.post(
  "/sessions/:sessionId/end",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      // =================================================
      // RESOLVE REQUEST CONTEXT
      // =================================================

      const sessionId =
        normaliseId(
          req.params?.sessionId
        );


      const userId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      console.log(
        "[Training] END SESSION REQUEST",
        {

          sessionId,

          userId,

          tenantId,

        }
      );


      // =================================================
      // VALIDATE SESSION ID
      // =================================================

      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "INVALID_TRAINING_SESSION_ID",

          });

      }


      // =================================================
      // LOAD SESSION
      // =================================================

      const session =
        await TrainingSession.findOne({

          _id:
            sessionId,

          tenantId,

        });


      if (
        !session
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_FOUND",

          });

      }


      // =================================================
      // HOST ONLY
      // =================================================

      if (
        normaliseId(
          session.hostUserId
        ) !==
        userId
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_HOST_ONLY",

            message:
              "Only the training session host can end this session.",

          });

      }


      // =================================================
      // ALREADY ENDED
      // =================================================
      //
      // Do not perform another cancellation pass.
      //
      // The original response remains useful to callers
      // retrying an already completed end operation.
      //
      // =================================================

      if (
        session.status ===
        "ended"
      ) {

        console.log(
          "[Training] END SESSION - already ended",
          {

            sessionId,

            endedAt:
              session.endedAt,

          }
        );


        return res.json({

          ok:
            true,

          alreadyEnded:
            true,

          session:
            serialiseSession(
              session
            ),

          cancellationResult: {

            cancelledCount:
              0,

            participantIds:
              [],

          },

        });

      }


      // =================================================
      // VALIDATE ENDABLE STATE
      // =================================================

      if (
        session.status !==
          "active" &&
        session.status !==
          "inviting"
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_ENDABLE",

            message:
              `Training session cannot be ended from status "${session.status}".`,

          });

      }


      // =================================================
      // CAPTURE OUTSTANDING INVITATIONS
      // =================================================
      //
      // Capture these BEFORE changing their status so we
      // know exactly which participants were cancelled.
      //
      // =================================================

      const outstandingParticipants =
        await TrainingParticipant.find({

          sessionId:
            session._id,

          tenantId,

          status:
            "invited",

        })
          .select(
            "_id userId"
          )
          .lean();


      const cancelledParticipantIds =
        outstandingParticipants
          .map(
            participant =>
              normaliseId(
                participant.userId
              )
          )
          .filter(Boolean);


      console.log(
        "[Training] Outstanding invitations found",
        {

          sessionId,

          count:
            outstandingParticipants.length,

          participantIds:
            cancelledParticipantIds,

        }
      );


      // =================================================
      // END SESSION
      // =================================================

      session.status =
        "ended";


      session.endedAt =
        new Date();


      await session.save();


      // =================================================
      // CANCEL OUTSTANDING INVITATIONS
      // =================================================

      const cancellationTime =
        new Date();


      const cancellationWriteResult =
        await TrainingParticipant.updateMany(
          {

            sessionId:
              session._id,

            tenantId,

            status:
              "invited",

          },
          {

            $set: {

              status:
                "cancelled",

              cancelledAt:
                cancellationTime,

            },

          }
        );


     const cancellationResult =
        await TrainingParticipant.updateMany(
            {
            sessionId:
                session._id,

            tenantId,

            status:
                "invited",
            },
    {
      $set: {
        status:
          "cancelled",

        cancelledAt:
          session.endedAt,
      },
    }
  );


      console.log(
        "[Training] Outstanding invitations cancelled",
        {

          sessionId,

          cancelledCount:
            cancellationResult.cancelledCount,

          participantIds:
            cancellationResult.participantIds,

        }
      );


      // =================================================
      // REALTIME SOCKET NAMESPACE
      // =================================================

      const namespace =
        getTrainingNamespace(
          req
        );


      // =================================================
      // REALTIME END EVENT
      // =================================================

      if (
        namespace
      ) {

        const payload = {

          sessionId,

          reason:
            "host-ended",

          endedBy:
            userId,

          endedAt:
            session.endedAt,

          cancellationResult,

        };


        // -----------------------------------------------
        // TRAINING ROOM
        // -----------------------------------------------

        namespace
          .to(
            getTrainingRoom(
              sessionId
            )
          )
          .emit(
            "training-session:ended",
            payload
          );


        // -----------------------------------------------
        // PARTICIPANT USER ROOMS
        // -----------------------------------------------
        //
        // This is important because an invited user may
        // not yet have joined the training room.
        //
        // They should still be told that the invitation
        // has been cancelled.
        //
        // -----------------------------------------------

        const participants =
          await TrainingParticipant.find({

            sessionId:
              session._id,

            tenantId,

          })
            .select(
              "userId"
            )
            .lean();


        participants.forEach(
          participant => {

            const participantUserId =
              normaliseId(
                participant.userId
              );


            if (
              !participantUserId
            ) {

              return;

            }


            namespace
              .to(
                getUserRoom(
                  participantUserId
                )
              )
              .emit(
                "training-session:ended",
                payload
              );

          }
        );


        console.log(
          "[Training] TRAINING_SESSION_ENDED emitted",
          {

            ...payload,

            participantCount:
              participants.length,

          }
        );

      }
      else {

        console.warn(
          "[Training] Socket.IO namespace unavailable while ending session",
          {

            sessionId,

          }
        );

      }


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Session ended",
        {

          sessionId,

          hostUserId:
            userId,

          channelName:
            session.channelName,

          endedAt:
            session.endedAt,

          cancellationResult,

        }
      );


      return res.json({

        ok:
          true,

        alreadyEnded:
          false,

        session:
          serialiseSession(
            session
          ),

        cancellationResult,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] End training session failed",
        error
      );


      console.error(
        "[Training] End training backend error details",
        {

          message:
            error?.message,

          stack:
            error?.stack,

        }
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_SESSION_END_FAILED",

          message:
            "Failed to end training session.",

        });

    }

  }
);


// =====================================================
// JOIN TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions/:sessionId/join
//
// Client-side action then joins Agora.
//
// Backend:
//
//   invited → joined
//
// =====================================================

router.post(
  "/sessions/:sessionId/join",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const sessionId =
        normaliseId(
          req.params?.sessionId
        );


      const userId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "INVALID_TRAINING_SESSION_ID",

          });

      }


      // =================================================
      // SESSION
      // =================================================

      const session =
        await TrainingSession.findOne({

          _id:
            sessionId,

          tenantId,

        });


      if (
        !session
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_FOUND",

          });

      }


      // =================================================
      // EXPIRATION
      // =================================================

      const now =
        new Date();


      if (
        session.status ===
          "inviting" &&
        session.invitationExpiresAt &&
        session.invitationExpiresAt <=
          now
      ) {

        session.status =
          "expired";


        session.expiredAt =
          now;


        await session.save();

        const expirationResult =
        await TrainingParticipant.updateMany(
            
            {
            sessionId: session._id,
            tenantId,
            status: "invited",
            },
            {
            $set: {
                status: "expired",
                expiredAt: expirationTime,
            },
            }
        );

        console.log(
        "[Training] Outstanding invitations expired",
        {
            sessionId,
            expiredCount:
            expirationResult.modifiedCount,
        }
        );


        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_INVITATION_EXPIRED",

            message:
              "This training invitation has expired.",

          });

      }


      // =================================================
      // MUST BE ACTIVE
      // =================================================

      if (
        session.status !==
        "active"
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_ACTIVE",

            message:
              "The trainer has not started this training session yet.",

          });

      }


      // =================================================
      // PARTICIPANT
      // =================================================

      const participant =
        await TrainingParticipant.findOne({

          sessionId:
            session._id,

          tenantId,

          userId,

        });


      if (
        !participant
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANT_NOT_FOUND",

            message:
              "You are not invited to this training session.",

          });

      }


      // =================================================
      // ALREADY JOINED
      // =================================================

      if (
        participant.status ===
        "joined"
      ) {

        return res.json({

          ok:
            true,

          alreadyJoined:
            true,

          session:
            serialiseSession(
              session
            ),

          participant:
            serialiseParticipant(
              participant
            ),

        });

      }


      // =================================================
      // MUST BE INVITED
      // =================================================

      if (
        participant.status !==
        "invited"
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANT_NOT_JOINABLE",

            message:
              `Participant cannot join from status "${participant.status}".`,

          });

      }


      // =================================================
      // MARK JOINED
      // =================================================

      participant.status =
        "joined";


      participant.joinedAt =
        new Date();


      participant.leftAt =
        null;


      await participant.save();


      // =================================================
      // TRAINING SOCKET ROOM
      // =================================================
      //
      // The frontend will also ask the realtime service
      // to join the training room once training.joined
      // becomes true.
      //
      // We don't modify socket state here because the
      // HTTP request and Socket.IO connection are separate.
      //
      // =================================================


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Participant joined session",
        {

          sessionId,

          userId,

          channelName:
            session.channelName,

        }
      );


      return res.json({

        ok:
          true,

        alreadyJoined:
          false,

        session:
          serialiseSession(
            session
          ),

        participant:
          serialiseParticipant(
            participant
          ),

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] Join training session failed",
        error
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_SESSION_JOIN_FAILED",

          message:
            "Failed to join training session.",

        });

    }

  }
);


// =====================================================
// LEAVE TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions/:sessionId/leave
//
// Participant only.
//
// joined → left
//
// This does NOT end the training session.
//
// Client action is responsible for Agora cleanup.
// =====================================================

router.post(
  "/sessions/:sessionId/leave",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const sessionId =
        normaliseId(
          req.params?.sessionId
        );


      const userId =
        normaliseId(
          req.user.userId
        );


      const tenantId =
        normaliseId(
          req.user.tenantId
        );


      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            ok:
              false,

            error:
              "INVALID_TRAINING_SESSION_ID",

          });

      }


      // =================================================
      // SESSION
      // =================================================

      const session =
        await TrainingSession.findOne({

          _id:
            sessionId,

          tenantId,

        });


      if (
        !session
      ) {

        return res
          .status(404)
          .json({

            ok:
              false,

            error:
              "TRAINING_SESSION_NOT_FOUND",

          });

      }


      // =================================================
      // HOST MUST END
      // =================================================

      if (
        normaliseId(
          session.hostUserId
        ) ===
        userId
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_HOST_MUST_END_SESSION",

            message:
              "The training host must end the session rather than leave it.",

          });

      }


      // =================================================
      // PARTICIPANT
      // =================================================

      const participant =
        await TrainingParticipant.findOne({

          sessionId:
            session._id,

          tenantId,

          userId,

        });


      if (
        !participant
      ) {

        return res
          .status(403)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANT_NOT_FOUND",

          });

      }


      // =================================================
      // ALREADY LEFT
      // =================================================

      if (
        participant.status ===
        "left"
      ) {

        return res.json({

          ok:
            true,

          alreadyLeft:
            true,

          session:
            serialiseSession(
              session
            ),

          participant:
            serialiseParticipant(
              participant
            ),

        });

      }


      // =================================================
      // ONLY JOINED CAN LEAVE
      // =================================================

      if (
        participant.status !==
        "joined"
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "TRAINING_PARTICIPANT_NOT_LEAVABLE",

            message:
              `Participant cannot leave from status "${participant.status}".`,

          });

      }


      // =================================================
      // MARK LEFT
      // =================================================

      const leftAt =
        new Date();


      participant.status =
        "left";


      participant.leftAt =
        leftAt;


      await participant.save();


      // =================================================
      // REALTIME PARTICIPANT LEFT
      // =================================================

      const namespace =
        getTrainingNamespace(
          req
        );


      if (
        namespace
      ) {

        const payload = {

          sessionId,

          userId,

          leftAt,

        };


        namespace
          .to(
            getTrainingRoom(
              sessionId
            )
          )
          .emit(
            "training-session:participant-left",
            payload
          );


        console.log(
          "[Training] TRAINING_SESSION_PARTICIPANT_LEFT emitted",
          payload
        );

      }


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Participant left training session",
        {

          sessionId,

          userId,

          leftAt,

        }
      );


      return res.json({

        ok:
          true,

        alreadyLeft:
          false,

        session:
          serialiseSession(
            session
          ),

        participant:
          serialiseParticipant(
            participant
          ),

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] Leave training session failed",
        error
      );


      return res
        .status(500)
        .json({

          ok:
            false,

          error:
            "TRAINING_SESSION_LEAVE_FAILED",

          message:
            "Failed to leave training session.",

        });

    }

  }
);


export default router;