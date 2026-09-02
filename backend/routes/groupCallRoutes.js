// backend/routes/groupCallRoutes.js

import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";

import Call
  from "../models/call.js";

import Membership
  from "../models/Membership.js";

import User
  from "../models/User.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import requireTenant
  from "../middleware/requireTenant.js";

import {
  applyGroupCallParticipantLeave,
  applyGroupCallEnd,
  closeStaleGroupCallInvitations,
} from "../services/groupCallLifecycle.js";


// =====================================================
// ROUTER
// =====================================================

console.log(
  "[GroupCalls] MODULE LOADED",
  new Date().toISOString()
);


const router =
  express.Router();

router.use(
  (req, res, next) => {

    console.log(
      "[GroupCalls] ROUTE REQUEST",
      {
        method:
          req.method,

        originalUrl:
          req.originalUrl,

        path:
          req.path,

      }
    );

    next();

  }
);

// =====================================================
// CONFIG
// =====================================================

const GROUP_CALL_INVITATION_MINUTES =
  15;

const MAX_INVITEES =
  50;

const MAX_PENDING_INVITATIONS =
  50;


// =====================================================
// HELPERS
// =====================================================

// =====================================================
// VALID OBJECT ID
// =====================================================

function isValidObjectId(
  value
) {

  return mongoose.isValidObjectId(
    value
  );

}


// =====================================================
// NORMALISE OBJECT ID LIST
// =====================================================

function normaliseIds(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      value

        .map(
          id =>
            String(
              id
            ).trim()
        )

        .filter(
          id =>
            isValidObjectId(
              id
            )
        )

    ),
  ];

}


// =====================================================
// NORMALISE AGORA UID
// =====================================================

function normaliseAgoraUid(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const uid =
    String(
      value
    ).trim();


  return uid ||
    null;

}


// =====================================================
// CURRENT TIMESTAMP
// =====================================================

function now() {

  return new Date();

}


// =====================================================
// MAKE GROUP CALL CHANNEL
// =====================================================

function makeChannelName({
  tenantId,
  userId,
}) {

  const random =
    crypto
      .randomBytes(
        6
      )
      .toString(
        "hex"
      );


  return (
    `group_t_${String(
      tenantId
    ).slice(-6)}` +

    `_u_${String(
      userId
    ).slice(-6)}` +

    `_${random}`
  );

}


// =====================================================
// LOAD CURRENT MEMBERSHIP
// =====================================================

async function loadMembership(
  req
) {

  return Membership.findOne({

    userId:
      req.user.userId,

    tenantId:
      req.user.tenantId,

  })
    .lean();

}


// =====================================================
// LOAD TENANT MEMBERS
// =====================================================

async function loadTenantMembers({
  tenantId,
  userIds,
}) {

  if (
    !Array.isArray(
      userIds
    ) ||
    userIds.length ===
      0
  ) {

    return [];

  }


  return Membership.find({

    tenantId,

    userId: {
      $in:
        userIds,
    },

  })
    .select(
      "userId role isAvailable"
    )
    .lean();

}


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers(
  userIds
) {

  if (
    !Array.isArray(
      userIds
    ) ||
    userIds.length ===
      0
  ) {

    return [];

  }


  return User.find({

    _id: {
      $in:
        userIds,
    },

  })
    .select(
      "_id firstName lastName email"
    )
    .lean();

}


// =====================================================
// BUILD DISPLAY NAME
// =====================================================

function buildDisplayName(
  user
) {

  if (
    !user
  ) {

    return "Participant";

  }


  const fullName =
    [
      user.firstName,
      user.lastName,
    ]

      .filter(Boolean)

      .join(" ")

      .trim();


  return (
    fullName ||
    user.email ||
    "Participant"
  );

}


// =====================================================
// BUILD PARTICIPANT
// =====================================================

function buildParticipant({
  userId,
  status = "invited",
  agoraUid = null,
  invitedAt = null,
  acceptedAt = null,
  joinedAt = null,
  leftAt = null,
  declinedAt = null,
}) {

  return {

    userId,

    agoraUid:
      normaliseAgoraUid(
        agoraUid
      ),

    status,

    invitedAt,

    acceptedAt,

    declinedAt,

    joinedAt,

    leftAt,

  };

}


// =====================================================
// FIND PARTICIPANT
// =====================================================

function findParticipant(
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
// FIND GROUP CALL
// =====================================================

async function findGroupCall({
  callId,
  tenantId,
}) {

  if (
    !isValidObjectId(
      callId
    )
  ) {

    return null;

  }


  return Call.findOne({

    _id:
      callId,

    tenantId,

    type:
      "group",

  });

}


// =====================================================
// RECONCILE INVITATION EXPIRY
// =====================================================
//
// IMPORTANT:
//
// This only reconciles invitation expiry.
//
// It NEVER kills an active group call.
//
// Group calls have:
//
//   expiresAt = null
//
// and:
//
//   invitationExpiresAt = +15 minutes
//
// =====================================================

async function reconcileInvitationExpiry(
  call
) {

  if (
    !call
  ) {

    return {

      ok:
        false,

      changed:
        false,

      closedCount:
        0,

    };

  }


  const result =
    closeStaleGroupCallInvitations(
      call,
      now()
    );


  if (
    result.changed
  ) {

    await call.save();

  }


  return result;

}


// =====================================================
// ENRICH PARTICIPANTS
// =====================================================

async function enrichParticipants(
  participants
) {

  const source =
    Array.isArray(
      participants
    )
      ? participants
      : [];


  const userIds =
    [
      ...new Set(

        source

          .map(
            participant =>
              participant?.userId
          )

          .filter(Boolean)

          .map(
            userId =>
              String(
                userId
              )
          )

      ),
    ];


  const users =
    await loadUsers(
      userIds
    );


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


  return source.map(
    participant => {

      const raw =
        typeof participant?.toObject ===
        "function"

          ? participant.toObject()

          : participant;


      const user =
        userMap.get(
          String(
            participant?.userId
          )
        ) ||
        null;


      return {

        userId:
          participant?.userId
            ? String(
                participant.userId
              )
            : null,

        agoraUid:
          normaliseAgoraUid(
            participant?.agoraUid
          ),

        status:
          participant?.status ||
          "invited",

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

                displayName:
                  buildDisplayName(
                    user
                  ),

              }

            : null,

        // -------------------------------------------------
        // Preserve any additional participant metadata.
        // -------------------------------------------------

        ...(
          raw &&
          typeof raw ===
            "object"

            ? raw

            : {}
        ),

      };

    }
  );

}


// =====================================================
// ENRICH CALL
// =====================================================

async function enrichCall(
  call
) {

  if (
    !call
  ) {

    return null;

  }


  const raw =
    typeof call.toObject ===
    "function"

      ? call.toObject()

      : call;


  const participants =
    await enrichParticipants(
      call.participants
    );


  return {

    ...raw,

    _id:
      raw._id
        ? String(
            raw._id
          )
        : raw._id,

    clientUserId:
      raw.clientUserId
        ? String(
            raw.clientUserId
          )
        : raw.clientUserId,

    recipientUserId:
      raw.recipientUserId
        ? String(
            raw.recipientUserId
          )
        : null,

    claimedByUserId:
      raw.claimedByUserId
        ? String(
            raw.claimedByUserId
          )
        : null,

    participants,

  };

}


// =====================================================
// 1. CREATE GROUP CALL
// =====================================================
//
// POST /api/group-calls
//
// =====================================================

router.post(
  "/",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;

      const creatorId =
        req.user.userId;


      // =================================================
      // CREATOR MEMBERSHIP
      // =================================================

      const creatorMembership =
        await loadMembership(
          req
        );


      if (
        !creatorMembership
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not a member of this tenant",

          });

      }


      // =================================================
      // REQUESTED PARTICIPANTS
      // =================================================

      const participantIds =
        normaliseIds(
          req.body?.participantIds
        );


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
        MAX_INVITEES
      ) {

        return res
          .status(400)
          .json({

            error:
              `A maximum of ${MAX_INVITEES} participants can be invited`,

          });

      }


      // =================================================
      // REMOVE CREATOR
      // =================================================

      const inviteeIds =
        participantIds.filter(
          userId =>
            String(
              userId
            ) !==
            String(
              creatorId
            )
        );


      if (
        inviteeIds.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            error:
              "A group call must include at least one other participant",

          });

      }


      // =================================================
      // VALIDATE TENANT MEMBERSHIP
      // =================================================

      const memberships =
        await loadTenantMembers({

          tenantId,

          userIds:
            inviteeIds,

        });


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


      const invalidUsers =
        inviteeIds.filter(
          userId =>
            !membershipMap.has(
              String(
                userId
              )
            )
        );


      if (
        invalidUsers.length
      ) {

        return res
          .status(403)
          .json({

            error:
              "One or more participants are not members of this tenant",

            invalidUserIds:
              invalidUsers,

          });

      }


      // =================================================
      // CHANNEL
      // =================================================

      const channelName =
        makeChannelName({

          tenantId,

          userId:
            creatorId,

        });


      const timestamp =
        now();


      // =================================================
      // INVITATION EXPIRY ONLY
      // =================================================
      //
      // IMPORTANT:
      //
      // This is NOT the call expiry.
      //
      // The call itself remains alive until explicitly
      // ended by lifecycle rules.
      //
      // =================================================

      const invitationExpiresAt =
        new Date(

          timestamp.getTime() +

          GROUP_CALL_INVITATION_MINUTES *
          60 *
          1000

        );


      // =================================================
      // PARTICIPANTS
      // =================================================

      const participants = [

        // -----------------------------------------------
        // HOST
        // -----------------------------------------------
        //
        // The host has accepted the call but has not yet
        // completed the Agora join.
        //
        // joinGroupCall() will transition:
        //
        // accepted → joined
        //
        // and assign the real Agora UID.
        //

        buildParticipant({

          userId:
            creatorId,

          status:
            "accepted",

          invitedAt:
            null,

          acceptedAt:
            timestamp,

          joinedAt:
            null,

          agoraUid:
            null,

        }),


        // -----------------------------------------------
        // INVITEES
        // -----------------------------------------------

        ...inviteeIds.map(
          userId =>
            buildParticipant({

              userId,

              status:
                "invited",

              invitedAt:
                timestamp,

            })
        ),

      ];


      // =================================================
      // CREATE CALL
      // =================================================

      const call =
        await Call.create({

          tenantId,

          clientUserId:
            creatorId,

          recipientUserId:
            null,

          claimedByUserId:
            null,

          channelName,

          type:
            "group",

          status:
            "ringing",

          participants,

          // ---------------------------------------------
          // NO HARD GROUP CALL EXPIRY.
          // ---------------------------------------------

          expiresAt:
            null,

          // ---------------------------------------------
          // ONLY INVITATION EXPIRY.
          // ---------------------------------------------

          invitationExpiresAt,

        });


      const enriched =
        await enrichCall(
          call
        );


      console.log(
        "[GroupCalls] Group call created",
        {

          callId:
            String(
              call._id
            ),

          tenantId:
            String(
              tenantId
            ),

          creatorId:
            String(
              creatorId
            ),

          channelName,

          invitationExpiresAt,

          inviteeCount:
            inviteeIds.length,

        }
      );


      return res
        .status(201)
        .json({

          ok:
            true,

          call:
            enriched,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Create group call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to create group call",

        });

    }

  }
);


// =====================================================
// 2. INVITE / RE-INVITE
// =====================================================
//
// POST /api/group-calls/:callId/invite
//
// =====================================================

router.post(
  "/:callId/invite",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

          });

      }


      // =================================================
      // RECONCILE INVITATIONS
      // =================================================

      await reconcileInvitationExpiry(
        call
      );


      // =================================================
      // CALL MUST BE ACTIVE
      // =================================================

      if (
        [
          "ended",
          "expired",
          "canceled",
        ].includes(
          call.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "Group call is no longer active",

          });

      }


      // =================================================
      // INVITER
      // =================================================

      const inviter =
        findParticipant(
          call,
          req.user.userId
        );


      if (
        !inviter
      ) {

        return res
          .status(403)
          .json({

            error:
              "You are not a participant in this group call",

          });

      }


      if (
        ![
          "accepted",
          "joined",
        ].includes(
          inviter.status
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "You must be an active participant to invite users",

          });

      }


      // =================================================
      // NORMALISE REQUEST
      // =================================================

      const userIds =
        normaliseIds(
          req.body?.userIds
        );


      if (
        userIds.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            error:
              "At least one userId is required",

          });

      }


      if (
        userIds.length >
        MAX_INVITEES
      ) {

        return res
          .status(400)
          .json({

            error:
              `A maximum of ${MAX_INVITEES} users can be invited at once`,

          });

      }


      const inviterId =
        String(
          req.user.userId
        );


      // =================================================
      // REMOVE SELF
      // =================================================

      const inviteeIds =
        userIds.filter(
          userId =>
            String(
              userId
            ) !==
            inviterId
        );


      if (
        inviteeIds.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            error:
              "You cannot invite yourself",

          });

      }


      // =================================================
      // MEMBERSHIP VALIDATION
      // =================================================

      const memberships =
        await loadTenantMembers({

          tenantId:
            req.user.tenantId,

          userIds:
            inviteeIds,

        });


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


      const invalidUsers =
        inviteeIds.filter(
          userId =>
            !membershipMap.has(
              String(
                userId
              )
            )
        );


      if (
        invalidUsers.length
      ) {

        return res
          .status(403)
          .json({

            error:
              "One or more users are not members of this tenant",

            invalidUserIds:
              invalidUsers,

          });

      }


      // =================================================
      // PARTICIPANT MAP
      // =================================================

      const participantMap =
        new Map(

          (call.participants || [])
            .map(
              participant => [

                String(
                  participant.userId
                ),

                participant,

              ]
            )

        );


      const added = [];

      const reinvited = [];

      const skipped = [];

      const timestamp =
        now();


      // =================================================
      // PROCESS INVITEES
      // =================================================

      for (
        const userId of
          inviteeIds
      ) {

        const key =
          String(
            userId
          );


        const existingParticipant =
          participantMap.get(
            key
          );


        // =============================================
        // NEW PARTICIPANT
        // =============================================

        if (
          !existingParticipant
        ) {

          const participant =
            buildParticipant({

              userId:

                userId,

              status:
                "invited",

              invitedAt:
                timestamp,

            });


          call.participants.push(
            participant
          );


          participantMap.set(
            key,
            participant
          );


          added.push(
            key
          );


          continue;

        }


        const status =
          existingParticipant.status;


        // =============================================
        // CURRENTLY ACTIVE / INVITED
        // =============================================

        if (
          [
            "invited",
            "accepted",
            "joined",
          ].includes(
            status
          )
        ) {

          skipped.push({

            userId:
              key,

            status,

          });


          continue;

        }


        // =============================================
        // RE-INVITE DECLINED
        // =============================================

        if (
          status ===
          "declined"
        ) {

          existingParticipant.status =
            "invited";

          existingParticipant.invitedAt =
            timestamp;

          existingParticipant.acceptedAt =
            null;

          existingParticipant.declinedAt =
            null;

          existingParticipant.joinedAt =
            null;

          existingParticipant.leftAt =
            null;

          existingParticipant.agoraUid =
            null;


          reinvited.push(
            key
          );


          continue;

        }


        // =============================================
        // RE-INVITE LEFT
        // =============================================

        if (
          status ===
          "left"
        ) {

          existingParticipant.status =
            "invited";

          existingParticipant.invitedAt =
            timestamp;

          existingParticipant.acceptedAt =
            null;

          existingParticipant.declinedAt =
            null;

          existingParticipant.joinedAt =
            null;

          existingParticipant.leftAt =
            null;

          existingParticipant.agoraUid =
            null;


          reinvited.push(
            key
          );


          continue;

        }


        // =============================================
        // UNKNOWN
        // =============================================

        skipped.push({

          userId:
            key,

          status:
            status ||
            "unknown",

        });

      }


      const changedCount =
        added.length +
        reinvited.length;


      // =================================================
      // NO CHANGE
      // =================================================

      if (
        changedCount ===
        0
      ) {

        const enriched =
          await enrichCall(
            call
          );


        return res.json({

          ok:
            true,

          call:
            enriched,

          added,

          reinvited,

          skipped,

          requested:
            inviteeIds,

          count:
            0,

        });

      }


      // =================================================
      // FRESH INVITATION EXPIRY
      // =================================================
      //
      // IMPORTANT:
      //
      // Re-invite does NOT restart the call lifetime.
      //
      // It only creates a new 15-minute invitation window.
      //
      // =================================================

      const freshInvitationExpiresAt =
        new Date(

          timestamp.getTime() +

          GROUP_CALL_INVITATION_MINUTES *
          60 *
          1000

        );


      call.invitationExpiresAt =
        freshInvitationExpiresAt;


      // Explicitly preserve no hard group-call expiry.

      call.expiresAt =
        null;


      // A ringing call becomes active once the host is
      // already participating / re-inviting.

      if (
        call.status ===
        "ringing"
      ) {

        call.status =
          "active";

      }


      await call.save();


      const enriched =
        await enrichCall(
          call
        );


      // =================================================
      // SOCKET.IO
      // =================================================

      const io =
        req.app?.get?.(
          "io"
        ) ||
        null;


      const namespace =
        io
          ? io.of(
              "/group-calls"
            )
          : null;


      const invitationUserIds =
        [
          ...added,
          ...reinvited,
        ];


      if (
        namespace &&
        invitationUserIds.length
      ) {

        for (
          const userId of
            invitationUserIds
        ) {

          namespace.emit(
            "group-call:invited",
            {

              callId:
                String(
                  call._id
                ),

              userId:
                String(
                  userId
                ),

              invitedBy:
                inviterId,

              reason:
                added.includes(
                  String(
                    userId
                  )
                )
                  ? "invited"
                  : "reinvited",

              createdAt:
                timestamp,

            }
          );

        }


        console.log(
          "[GroupCalls] GROUP_CALL_INVITED emitted",
          {

            callId:
              String(
                call._id
              ),

            invitedUsers:
              invitationUserIds,

          }
        );

      }


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "[GroupCalls] Invite / re-invite completed",
        {

          callId:
            String(
              call._id
            ),

          invitedBy:
            inviterId,

          requested:
            inviteeIds,

          added,

          reinvited,

          skipped,

          changedCount,

          invitationExpiresAt:
            freshInvitationExpiresAt,

        }
      );


      return res.json({

        ok:
          true,

        call:
          enriched,

        added,

        reinvited,

        skipped,

        requested:
          inviteeIds,

        count:
          changedCount,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Invite / re-invite users failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to invite users",

        });

    }

  }
);


// =====================================================
// 3. GET MY PENDING GROUP INVITATIONS
// =====================================================
//
// GET /api/group-calls/invitations
//
// =====================================================

router.get(
  "/invitations",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;

      const userId =
        req.user.userId;


      // =================================================
      // FIND CURRENTLY INVITED PARTICIPANTS
      // =================================================

      const calls =
        await Call.find({

          tenantId,

          type:
            "group",

          status: {

            $in: [

              "ringing",

              "active",

            ],

          },

          participants: {

            $elemMatch: {

              userId,

              status:
                "invited",

            },

          },

        })

          .sort({

            createdAt:
              -1,

          })

          .limit(
            MAX_PENDING_INVITATIONS
          );


      const activeCalls = [];


      // =================================================
      // RECONCILE
      // =================================================

      for (
        const call of
          calls
      ) {

        const lifecycle =
          await reconcileInvitationExpiry(
            call
          );


        if (
          ![
            "ringing",
            "active",
          ].includes(
            call.status
          )
        ) {

          continue;

        }


        if (
          lifecycle?.invitationExpired &&
          lifecycle.closedCount > 0
        ) {

          continue;

        }


        const participant =
          findParticipant(
            call,
            userId
          );


        if (
          !participant ||
          participant.status !==
            "invited"
        ) {

          continue;

        }


        activeCalls.push(
          call
        );

      }


      // =================================================
      // LOAD CREATORS
      // =================================================

      const creatorIds =
        [
          ...new Set(

            activeCalls.map(
              call =>
                String(
                  call.clientUserId
                )
            )

          ),
        ];


      const creators =
        await loadUsers(
          creatorIds
        );


      const creatorMap =
        new Map(

          creators.map(
            creator => [

              String(
                creator._id
              ),

              creator,

            ]
          )

        );


      // =================================================
      // BUILD INVITATIONS
      // =================================================

      const invitations =
        activeCalls

          .map(
            call => {

              const participant =
                findParticipant(
                  call,
                  userId
                );


              if (
                !participant ||
                participant.status !==
                  "invited"
              ) {

                return null;

              }


              const creator =
                creatorMap.get(
                  String(
                    call.clientUserId
                  )
                ) ||
                null;


              return {

                callId:
                  String(
                    call._id
                  ),

                channelName:
                  call.channelName,

                status:
                  call.status,

                createdAt:
                  call.createdAt,

                // -----------------------------------------
                // No hard group-call expiry.
                // -----------------------------------------

                expiresAt:
                  null,

                invitationExpiresAt:
                  call.invitationExpiresAt,

                creator,

                participant:

                  typeof participant.toObject ===
                  "function"

                    ? participant.toObject()

                    : participant,

              };

            }
          )

          .filter(Boolean);


      return res.json({

        ok:
          true,

        invitations,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Get invitations failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load group call invitations",

        });

    }

  }
);


// =====================================================
// 4. ACCEPT INVITATION
// =====================================================

router.post(
  "/:callId/accept",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

          });

      }


      await reconcileInvitationExpiry(
        call
      );


      if (
        [
          "expired",
          "ended",
          "canceled",
        ].includes(
          call.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_NOT_AVAILABLE",

            message:
              "This group call is no longer available.",

          });

      }


      const participant =
        findParticipant(
          call,
          req.user.userId
        );


      if (
        !participant
      ) {

        return res
          .status(403)
          .json({

            error:
              "You were not invited to this group call",

          });

      }


      // =================================================
      // EXPLICIT INVITATION EXPIRY CHECK
      // =================================================

      const timestamp =
        now();


      if (
        participant.status ===
          "invited" &&

        call.invitationExpiresAt &&

        new Date(
          call.invitationExpiresAt
        ).getTime() <=
          timestamp.getTime()
      ) {

        participant.status =
          "left";

        participant.leftAt =
          timestamp;

        participant.agoraUid =
          null;


        await call.save();


        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_INVITATION_EXPIRED",

            message:
              "This group call invitation has expired.",

          });

      }


      if (
        [
          "declined",
          "left",
        ].includes(
          participant.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_INVITATION_CLOSED",

          });

      }


      if (
        [
          "accepted",
          "joined",
        ].includes(
          participant.status
        )
      ) {

        const enriched =
          await enrichCall(
            call
          );


        return res.json({

          ok:
            true,

          alreadyAccepted:
            true,

          call:
            enriched,

        });

      }


      // =================================================
      // ACCEPT
      // =================================================

      participant.status =
        "accepted";

      participant.acceptedAt =
        timestamp;

      participant.declinedAt =
        null;


      if (
        call.status ===
        "ringing"
      ) {

        call.status =
          "active";

      }


      await call.save();


      const enriched =
        await enrichCall(
          call
        );


      console.log(
        "[GroupCalls] Invitation accepted",
        {

          callId:
            String(
              call._id
            ),

          userId:
            String(
              req.user.userId
            ),

        }
      );


      return res.json({

        ok:
          true,

        call:
          enriched,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Accept invitation failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to accept group call invitation",

        });

    }

  }
);


// =====================================================
// 5. DECLINE INVITATION
// =====================================================

router.post(
  "/:callId/decline",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

          });

      }


      await reconcileInvitationExpiry(
        call
      );


      if (
        [
          "expired",
          "ended",
          "canceled",
        ].includes(
          call.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_NOT_AVAILABLE",

          });

      }


      const participant =
        findParticipant(
          call,
          req.user.userId
        );


      if (
        !participant
      ) {

        return res
          .status(403)
          .json({

            error:
              "You were not invited to this group call",

          });

      }


      if (
        participant.status ===
        "joined"
      ) {

        return res
          .status(409)
          .json({

            error:
              "You have already joined this group call",

          });

      }


      if (
        participant.status ===
        "declined"
      ) {

        const enriched =
          await enrichCall(
            call
          );


        return res.json({

          ok:
            true,

          alreadyDeclined:
            true,

          call:
            enriched,

        });

      }


      if (
        participant.status ===
        "left"
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_INVITATION_CLOSED",

          });

      }


      participant.status =
        "declined";

      participant.declinedAt =
        now();

      participant.agoraUid =
        null;


      await call.save();


      const enriched =
        await enrichCall(
          call
        );


      console.log(
        "[GroupCalls] Invitation declined",
        {

          callId:
            String(
              call._id
            ),

          userId:
            String(
              req.user.userId
            ),

        }
      );


      return res.json({

        ok:
          true,

        call:
          enriched,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Decline invitation failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to decline group call invitation",

        });

    }

  }
);


// =====================================================
// 6. JOIN GROUP CALL
// =====================================================
//
// POST /api/group-calls/:callId/join
//
// =====================================================

router.post(
  "/:callId/join",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const agoraUid =
        normaliseAgoraUid(
          req.body?.agoraUid
        );


      if (
        !agoraUid
      ) {

        return res
          .status(400)
          .json({

            error:
              "GROUP_CALL_AGORA_UID_REQUIRED",

          });

      }


      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

          });

      }


      await reconcileInvitationExpiry(
        call
      );


      if (
        [
          "expired",
          "ended",
          "canceled",
        ].includes(
          call.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_NOT_AVAILABLE",

            message:
              "This group call is no longer available.",

          });

      }


      const participant =
        findParticipant(
          call,
          req.user.userId
        );


      if (
        !participant
      ) {

        return res
          .status(403)
          .json({

            error:
              "You are not a participant in this group call",

          });

      }


      if (
        participant.status ===
        "invited"
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_INVITATION_NOT_ACCEPTED",

            message:
              "Accept the invitation before joining the group call.",

          });

      }


      if (
        participant.status ===
        "declined"
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_INVITATION_DECLINED",

          });

      }


      if (
        participant.status ===
        "left"
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_PARTICIPANT_LEFT",

          });

      }


      // =================================================
      // AGORA UID COLLISION
      // =================================================

      const conflictingParticipant =
        call.participants?.find(

          item =>

            String(
              item.userId
            ) !==
            String(
              req.user.userId
            ) &&

            normaliseAgoraUid(
              item.agoraUid
            ) ===
            agoraUid

        );


      if (
        conflictingParticipant
      ) {

        return res
          .status(409)
          .json({

            error:
              "GROUP_CALL_AGORA_UID_ALREADY_ASSIGNED",

          });

      }


      // =================================================
      // APPLICATION JOIN
      // =================================================

      const timestamp =
        now();


      participant.status =
        "joined";

      participant.joinedAt =
        participant.joinedAt ||
        timestamp;

      participant.leftAt =
        null;

      participant.agoraUid =
        agoraUid;


      if (
        call.status ===
        "ringing"
      ) {

        call.status =
          "active";

      }


      await call.save();


      const enriched =
        await enrichCall(
          call
        );


      console.log(
        "[GroupCalls] Participant joined group call",
        {

          callId:
            String(
              call._id
            ),

          userId:
            String(
              req.user.userId
            ),

          agoraUid,

        }
      );


      return res.json({

        ok:
          true,

        call:
          enriched,

        channelName:
          call.channelName,

        agoraUid,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Join group call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to join group call",

        });

    }

  }
);


// =====================================================
// 7. LEAVE GROUP CALL
// =====================================================

router.post(
  "/:callId/leave",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

          });

      }


      const lifecycle =
        applyGroupCallParticipantLeave(

          call,

          req.user.userId,

          {

            reason:
              "participant-left",

          }

        );


      if (
        !lifecycle.ok
      ) {

        if (
          lifecycle.error ===
          "GROUP_CALL_PARTICIPANT_NOT_FOUND"
        ) {

          return res
            .status(403)
            .json({

              error:
                "You are not a participant in this group call",

            });

        }


        return res
          .status(400)
          .json({

            error:
              lifecycle.error,

          });

      }


      if (
        lifecycle.alreadyLeft
      ) {

        const enriched =
          await enrichCall(
            call
          );


        return res.json({

          ok:
            true,

          alreadyLeft:
            true,

          call:
            enriched,

          callEnded:
            lifecycle.callEnded,

        });

      }


      await call.save();


      const enriched =
        await enrichCall(
          call
        );


      // =================================================
      // SOCKET.IO
      // =================================================

      const io =
        req.app?.get?.(
          "io"
        ) ||
        null;


      const namespace =
        io
          ? io.of(
              "/group-calls"
            )
          : null;


      const room =
        `group-call:${String(
          call._id
        )}`;


      // =================================================
      // WHOLE CALL ENDED
      // =================================================

      if (
        lifecycle.callEnded &&
        namespace
      ) {

        namespace
          .to(
            room
          )
          .emit(
            "group-call:ended",
            {

              callId:
                String(
                  call._id
                ),

              reason:
                lifecycle.isHost
                  ? "host-left"
                  : "no-participants",

              endedBy:
                String(
                  req.user.userId
                ),

              endedAt:
                lifecycle.timestamp,

            }
          );


      }


      // =================================================
      // NORMAL PARTICIPANT LEFT
      // =================================================

      if (
        !lifecycle.callEnded &&
        namespace
      ) {

        namespace
          .to(
            room
          )
          .emit(
            "group-call:participant-left",
            {

              callId:
                String(
                  call._id
                ),

              userId:
                String(
                  req.user.userId
                ),

              leftAt:
                lifecycle.timestamp,

            }
          );

      }


      console.log(
        "[GroupCalls] Participant left",
        {

          callId:
            String(
              call._id
            ),

          userId:
            String(
              req.user.userId
            ),

          isHost:
            lifecycle.isHost,

          callEnded:
            lifecycle.callEnded,

          remaining:
            lifecycle.remainingActiveCount,

        }
      );


      return res.json({

        ok:
          true,

        call:
          enriched,

        left:
          true,

        callEnded:
          lifecycle.callEnded,

        isHost:
          lifecycle.isHost,

        remainingParticipants:
          lifecycle.remainingActiveCount,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Leave group call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to leave group call",

        });

    }

  }
);


// =====================================================
// 8. END GROUP CALL
// =====================================================
//
// POST /api/group-calls/:callId/end
//
// =====================================================

router.post(
  "/:callId/end",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

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

            error:
              "Not a member of this tenant",

          });

      }


      // =================================================
      // AUTHORISATION
      // =================================================

      const isCreator =
        String(
          call.clientUserId
        ) ===
        String(
          req.user.userId
        );


      const isOwnerAdmin =
        [
          "owner",
          "admin",
        ].includes(
          membership.role
        );


      if (
        !isCreator &&
        !isOwnerAdmin
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not allowed to end this group call",

          });

      }


      // =================================================
      // SHARED END LIFECYCLE
      // =================================================

      const lifecycle =
        applyGroupCallEnd(

          call,

          {

            reason:
              "host-ended",

            endedBy:
              req.user.userId,

          }

        );


      if (
        !lifecycle.ok
      ) {

        return res
          .status(400)
          .json({

            error:
              lifecycle.error,

          });

      }


      await call.save();


      const enriched =
        await enrichCall(
          call
        );


      // =================================================
      // SOCKET.IO
      // =================================================

      const io =
        req.app?.get?.(
          "io"
        ) ||
        null;


      const namespace =
        io
          ? io.of(
              "/group-calls"
            )
          : null;


      const room =
        `group-call:${String(
          call._id
        )}`;


      if (
        namespace &&
        !lifecycle.alreadyEnded
      ) {

        namespace
          .to(
            room
          )
          .emit(
            "group-call:ended",
            {

              callId:
                String(
                  call._id
                ),

              reason:
                "host-ended",

              endedBy:
                String(
                  req.user.userId
                ),

              endedAt:
                lifecycle.timestamp,

            }
          );


        console.log(
          "[GroupCalls] GROUP_CALL_ENDED emitted",
          {

            callId:
              String(
                call._id
              ),

            endedBy:
              String(
                req.user.userId
              ),

          }
        );

      }


      console.log(
        "[GroupCalls] Group call ended",
        {

          callId:
            String(
              call._id
            ),

          endedBy:
            String(
              req.user.userId
            ),

          alreadyEnded:
            lifecycle.alreadyEnded,

          closedParticipantCount:
            lifecycle.closedParticipantCount,

        }
      );


      return res.json({

        ok:
          true,

        call:
          enriched,

        alreadyEnded:
          lifecycle.alreadyEnded,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] End group call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to end group call",

        });

    }

  }
);


// =====================================================
// 9. GET GROUP CALL DETAILS
// =====================================================
//
// GET /api/group-calls/:callId
//
// =====================================================

router.get(
  "/:callId",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const call =
        await findGroupCall({

          callId:
            req.params.callId,

          tenantId:
            req.user.tenantId,

        });


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Group call not found",

          });

      }


      await reconcileInvitationExpiry(
        call
      );


      const participant =
        findParticipant(
          call,
          req.user.userId
        );


      if (
        !participant
      ) {

        return res
          .status(403)
          .json({

            error:
              "You are not a participant in this group call",

          });

      }


      const enriched =
        await enrichCall(
          call
        );


      const me =
        enriched.participants.find(
          item =>
            String(
              item.userId
            ) ===
            String(
              req.user.userId
            )
        ) ||
        null;


      return res.json({

        ok:
          true,

        call:
          enriched,

        me,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[GroupCalls] Get group call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load group call",

        });

    }

  }
);


// =====================================================
// EXPORT
// =====================================================

export default router;
