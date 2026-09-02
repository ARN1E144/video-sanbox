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


function serialiseSession(
  session
) {

  return {

    id:
      String(
        session._id
      ),

    tenantId:
      String(
        session.tenantId
      ),

    hostUserId:
      String(
        session.hostUserId
      ),

    channelName:
      session.channelName,

    status:
      session.status,

    createdAt:
      session.createdAt ||
      null,

    startedAt:
      session.startedAt ||
      null,

    endedAt:
      session.endedAt ||
      null,

  };

}


// =====================================================
// CREATE TRAINING SESSION
// =====================================================
//
// POST /api/training/sessions
//
// Body:
//
// {
//   participantIds: [
//     "userId1",
//     "userId2"
//   ]
// }
//
// Creates:
//
//   TrainingSession
//   TrainingParticipant[]
//
// Initial state:
//
//   inviting
//
// No Agora join happens here.
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
        req.user.userId;

      const tenantId =
        req.user.tenantId;


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

            error:
              "Host is not a member of this tenant",

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
      // NORMALISE + DEDUPLICATE
      // =================================================

      const participantIds = [
        ...new Set(

          rawParticipantIds
            .map(
              id =>
                String(
                  id
                ).trim()
            )
            .filter(Boolean)

        ),
      ];


      // =================================================
      // VALIDATE SIZE
      // =================================================

      if (
        participantIds.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            error:
              "At least one participant is required",

          });

      }


      if (
        participantIds.length >
        MAX_SESSION_PARTICIPANTS
      ) {

        return res
          .status(400)
          .json({

            error:
              `A maximum of ${MAX_SESSION_PARTICIPANTS} participants is allowed`,

          });

      }


      // =================================================
      // VALIDATE IDS
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

            error:
              "One or more participant IDs are invalid",

            invalidParticipantIds,

          });

      }


      // =================================================
      // HOST CANNOT BE PARTICIPANT
      // =================================================

      const hostIsSelected =
        participantIds.some(
          id =>
            String(
              id
            ) ===
            String(
              hostUserId
            )
        );


      if (
        hostIsSelected
      ) {

        return res
          .status(400)
          .json({

            error:
              "The host cannot be selected as a participant",

          });

      }


      // =================================================
      // PARTICIPANT OBJECT IDS
      // =================================================

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

              String(
                membership.userId
              ),

              membership,

            ]
          )

        );


      const missingMembershipIds =
        participantIds.filter(
          id =>
            !membershipMap.has(
              String(
                id
              )
            )
        );


      if (
        missingMembershipIds.length >
        0
      ) {

        return res
          .status(403)
          .json({

            error:
              "One or more participants are not members of this tenant",

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

              String(
                user._id
              ),

              user,

            ]
          )

        );


      const missingUserIds =
        participantIds.filter(
          id =>
            !userMap.has(
              String(
                id
              )
            )
        );


      if (
        missingUserIds.length >
        0
      ) {

        return res
          .status(404)
          .json({

            error:
              "One or more participant users could not be found",

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
      // CREATE PARTICIPANTS
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
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Session created",
        {

          sessionId:
            String(
              session._id
            ),

          hostUserId:
            String(
              hostUserId
            ),

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
            participants.map(
              participant => {

                const user =
                  userMap.get(
                    String(
                      participant.userId
                    )
                  );


                return {

                  id:
                    String(
                      participant._id
                    ),

                  userId:
                    String(
                      participant.userId
                    ),

                  sessionId:
                    String(
                      participant.sessionId
                    ),

                  status:
                    participant.status,

                  invitedAt:
                    participant.invitedAt ||
                    null,

                  joinedAt:
                    participant.joinedAt ||
                    null,

                  leftAt:
                    participant.leftAt ||
                    null,

                  user: {

                    id:
                      String(
                        user._id
                      ),

                    firstName:
                      user.firstName ||
                      "",

                    lastName:
                      user.lastName ||
                      "",

                    email:
                      user.email ||
                      "",

                  },

                };

              }
            ),

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

          error:
            "Failed to create training session",

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
// Returns sessions where the authenticated user has
// an invited participant record.
//
// Session states:
//
//   inviting
//   active
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
        req.user.userId;

      const tenantId =
        req.user.tenantId;


      // =================================================
      // FIND INVITATIONS
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
      // FIND SESSIONS
      // =================================================

      const sessionIds =
        participantRecords.map(
          participant =>
            participant.sessionId
        );


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
      // LOAD HOSTS
      // =================================================

      const hostIds = [
        ...new Set(

          sessions.map(
            session =>
              String(
                session.hostUserId
              )
          )

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

              String(
                host._id
              ),

              host,

            ]
          )

        );


      // =================================================
      // PARTICIPANTS MAP
      // =================================================

      const participantMap =
        new Map(

          participantRecords.map(
            participant => [

              String(
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

            const participant =
              participantMap.get(
                String(
                  session._id
                )
              );


            const host =
              hostMap.get(
                String(
                  session.hostUserId
                )
              ) ||
              null;


            return {

              ...serialiseSession(
                session
              ),

              participant: {

                id:
                  participant
                    ? String(
                        participant._id
                      )
                    : null,

                userId:
                  participant
                    ? String(
                        participant.userId
                      )
                    : String(
                        userId
                      ),

                status:
                  participant?.status ||
                  "invited",

                invitedAt:
                  participant?.invitedAt ||
                  null,

                joinedAt:
                  participant?.joinedAt ||
                  null,

                leftAt:
                  participant?.leftAt ||
                  null,

              },

              host:
                host
                  ? {

                      id:
                        String(
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


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Pending sessions loaded",
        {

          userId:
            String(
              userId
            ),

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

          error:
            "Failed to load pending training sessions",

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
// Returns a session to:
//
//   host
//   invited participant
//   joined participant
//
// Used by clients to detect:
//
//   active → ended
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

      const {
        sessionId,
      } =
        req.params;


      const userId =
        req.user.userId;

      const tenantId =
        req.user.tenantId;


      // =================================================
      // VALIDATE ID
      // =================================================

      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid training session ID",

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

            error:
              "Training session not found",

          });

      }


      // =================================================
      // LOAD MEMBERSHIP
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

            error:
              "Not a member of this tenant",

          });

      }


      // =================================================
      // AUTHORISATION
      // =================================================

      const isHost =
        String(
          session.hostUserId
        ) ===
        String(
          userId
        );


      const participant =
        await TrainingParticipant.findOne({

          sessionId:
            session._id,

          tenantId,

          userId,

        })
          .lean();


      const isParticipant =
        !!participant;


      if (
        !isHost &&
        !isParticipant
      ) {

        return res
          .status(403)
          .json({

            error:
              "You are not authorised to view this training session",

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
          participant
            ? {

                id:
                  String(
                    participant._id
                  ),

                userId:
                  String(
                    participant.userId
                  ),

                sessionId:
                  String(
                    participant.sessionId
                  ),

                status:
                  participant.status,

                invitedAt:
                  participant.invitedAt ||
                  null,

                joinedAt:
                  participant.joinedAt ||
                  null,

                leftAt:
                  participant.leftAt ||
                  null,

              }
            : null,

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

          error:
            "Failed to load training session",

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
// This endpoint does NOT join Agora.
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

      const {
        sessionId,
      } =
        req.params;


      const userId =
        req.user.userId;

      const tenantId =
        req.user.tenantId;


      // =================================================
      // VALIDATE ID
      // =================================================

      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid training session ID",

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

            error:
              "Training session not found",

          });

      }


      // =================================================
      // HOST AUTHORISATION
      // =================================================

      if (
        String(
          session.hostUserId
        ) !==
        String(
          userId
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Only the training session host can start this session",

          });

      }


      // =================================================
      // ALREADY ACTIVE
      // =================================================

      if (
        session.status ===
        "active"
      ) {

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
      // INVALID STATE
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
              `Training session cannot be started from status "${session.status}"`,

          });

      }


      // =================================================
      // START
      // =================================================

      session.status =
        "active";

      session.startedAt =
        new Date();

      session.endedAt =
        null;


      await session.save();


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Session started",
        {

          sessionId:
            String(
              session._id
            ),

          hostUserId:
            String(
              userId
            ),

          channelName:
            session.channelName,

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
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to start training session",

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
// Changes:
//
//   active → ended
//
// Sets:
//
//   endedAt
//
// The endpoint does NOT leave Agora.
// The frontend action handles the media disconnect.
//
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

      const {
        sessionId,
      } =
        req.params;


      const userId =
        req.user.userId;


      const tenantId =
        req.user.tenantId;


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

            error:
              "Invalid training session ID",

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

            error:
              "Training session not found",

          });

      }


      // =================================================
      // HOST AUTHORISATION
      // =================================================

      if (
        String(
          session.hostUserId
        ) !==
        String(
          userId
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Only the training session host can end this session",

          });

      }


      // =================================================
      // ALREADY ENDED
      // =================================================

      if (
        session.status ===
        "ended"
      ) {

        return res.json({

          ok:
            true,

          alreadyEnded:
            true,

          session:
            serialiseSession(
              session
            ),

        });

      }


      // =================================================
      // VALIDATE STATE
      // =================================================
      //
      // For V1 we allow ending an active session.
      //
      // We also allow an inviting session to be ended
      // so the host can cancel a pending invitation set.
      //
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
              `Training session cannot be ended from status "${session.status}"`,

          });

      }


      // =================================================
      // END SESSION
      // =================================================

      session.status =
        "ended";


      session.endedAt =
        new Date();


      await session.save();


      // =================================================
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Session ended",
        {

          sessionId:
            String(
              session._id
            ),

          hostUserId:
            String(
              userId
            ),

          channelName:
            session.channelName,

          endedAt:
            session.endedAt,

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

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Training] End training session failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to end training session",

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
// Invited participant only.
//
// invited → joined
//
// This endpoint does NOT join Agora.
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

      const {
        sessionId,
      } =
        req.params;


      const userId =
        req.user.userId;

      const tenantId =
        req.user.tenantId;


      // =================================================
      // VALIDATE ID
      // =================================================

      if (
        !isValidObjectId(
          sessionId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid training session ID",

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

            error:
              "Training session not found",

          });

      }

      // =================================================
    // EXPIRED INVITATION SAFETY CHECK
    // =================================================

    const now =
    new Date();

    if (
    session.status === "inviting" &&
    session.invitationExpiresAt &&
    session.invitationExpiresAt <= now
    ) {

    session.status =
        "expired";

    session.expiredAt =
        now;

    await session.save();

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
      // SESSION MUST BE ACTIVE
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
      // FIND PARTICIPANT
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

            error:
              "You are not invited to this training session",

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

          participant: {

            id:
              String(
                participant._id
              ),

            userId:
              String(
                participant.userId
              ),

            sessionId:
              String(
                participant.sessionId
              ),

            status:
              participant.status,

            invitedAt:
              participant.invitedAt ||
              null,

            joinedAt:
              participant.joinedAt ||
              null,

            leftAt:
              participant.leftAt ||
              null,

          },

        });

      }


      // =================================================
      // REQUIRE INVITED STATE
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
              `Participant cannot join from status "${participant.status}"`,

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
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Participant joined session",
        {

          sessionId:
            String(
              session._id
            ),

          userId:
            String(
              userId
            ),

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

        participant: {

          id:
            String(
              participant._id
            ),

          userId:
            String(
              participant.userId
            ),

          sessionId:
            String(
              participant.sessionId
            ),

          status:
            participant.status,

          invitedAt:
            participant.invitedAt ||
            null,

          joinedAt:
            participant.joinedAt ||
            null,

          leftAt:
            participant.leftAt ||
            null,

        },

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

          error:
            "Failed to join training session",

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
// Participant leaves their current training session.
//
// This does NOT end the training session.
//
// Participant:
//
//   joined -> left
//
// Host:
//
//   must use /end instead
//
// The frontend action is responsible for leaving Agora.
//
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

      const {
        sessionId,
      } =
        req.params;


      const userId =
        req.user.userId;

      const tenantId =
        req.user.tenantId;


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

            error:
              "Invalid training session ID",

          });

      }


      // =================================================
      // FIND SESSION
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

            error:
              "Training session not found",

          });

      }


      // =================================================
      // HOST CANNOT "LEAVE"
      // =================================================
      //
      // The host ends the entire training session.
      //
      // =================================================

      if (
        String(
          session.hostUserId
        ) ===
        String(
          userId
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "TRAINING_HOST_MUST_END_SESSION",

            message:
              "The training host must end the training session instead of leaving it.",

          });

      }


      // =================================================
      // FIND PARTICIPANT
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

          session: {

            id:
              String(
                session._id
              ),

            tenantId:
              String(
                session.tenantId
              ),

            hostUserId:
              String(
                session.hostUserId
              ),

            channelName:
              session.channelName,

            status:
              session.status,

            startedAt:
              session.startedAt ||
              null,

            endedAt:
              session.endedAt ||
              null,

          },

          participant: {

            id:
              String(
                participant._id
              ),

            userId:
              String(
                participant.userId
              ),

            sessionId:
              String(
                participant.sessionId
              ),

            status:
              participant.status,

            invitedAt:
              participant.invitedAt ||
              null,

            joinedAt:
              participant.joinedAt ||
              null,

            leftAt:
              participant.leftAt ||
              null,

          },

        });

      }


      // =================================================
      // ONLY A JOINED PARTICIPANT CAN LEAVE
      // =================================================

      if (
        participant.status !==
        "joined"
      ) {

        return res
          .status(409)
          .json({

            error:
              "TRAINING_PARTICIPANT_NOT_LEAVABLE",

            message:
              `Participant cannot leave from status "${participant.status}"`,

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
      // RESPONSE
      // =================================================

      console.log(
        "[Training] Participant left training session",
        {

          sessionId:
            String(
              session._id
            ),

          userId:
            String(
              userId
            ),

          leftAt,

        }
      );


      return res.json({

        ok:
          true,

        alreadyLeft:
          false,

        session: {

          id:
            String(
              session._id
            ),

          tenantId:
            String(
              session.tenantId
            ),

          hostUserId:
            String(
              session.hostUserId
            ),

          channelName:
            session.channelName,

          status:
            session.status,

          startedAt:
            session.startedAt ||
            null,

          endedAt:
            session.endedAt ||
            null,

        },

        participant: {

          id:
            String(
              participant._id
            ),

          userId:
            String(
              participant.userId
            ),

          sessionId:
            String(
              participant.sessionId
            ),

          status:
            participant.status,

          invitedAt:
            participant.invitedAt ||
            null,

          joinedAt:
            participant.joinedAt ||
            null,

          leftAt:
            participant.leftAt ||
            null,

        },

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

          error:
            "Failed to leave training session",

        });

    }

  }
);


export default router;