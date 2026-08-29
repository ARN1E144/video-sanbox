// backend/routes/calls.js

import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";

import Call from "../models/call.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import requireTenant from "../middleware/requireTenant.js";


const router =
  express.Router();


// =====================================================
// CALL POLICY
// =====================================================
//
// Queue mode:
//
//   client creates call
//        ↓
//   waiting
//        ↓
//   employee sees /available
//        ↓
//   employee accepts
//
// Targeted mode:
//
//   caller creates call with recipientId
//        ↓
//   ringing
//        ↓
//   recipient sees /pending
//        ↓
//   recipient joins
//
// =====================================================

const DEFAULT_CALL_POLICY = {

  mode:
    "queue",

  creators: [
    "member",
    "owner",
    "admin",
    "builder",
    "operative",
  ],

  responders: [
    "owner",
    "admin",
    "builder",
    "operative",
  ],

};


// =====================================================
// CONSTANTS
// =====================================================

const WAITING_CALL_EXPIRY_MINUTES =
  5;

const MAX_AVAILABLE_CALLS =
  50;

const MAX_PENDING_CALLS =
  10;


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


function makeChannelName({
  tenantId,
  userId,
}) {

  const short =
    crypto
      .randomBytes(6)
      .toString("hex");


  return (
    `t_${String(tenantId).slice(-6)}` +
    `_u_${String(userId).slice(-6)}` +
    `_${short}`
  );

}


function canCreateCall(
  membership,
  policy = DEFAULT_CALL_POLICY
) {

  return Boolean(
    membership?.role &&
    policy.creators.includes(
      membership.role
    )
  );

}


function canAcceptCall(
  membership,
  policy = DEFAULT_CALL_POLICY
) {

  return Boolean(
    membership?.role &&
    policy.responders.includes(
      membership.role
    )
  );

}


// =====================================================
// LOAD MEMBERSHIP
// =====================================================

async function loadMembership(
  req
) {

  const {
    userId,
    tenantId,
  } =
    req.user;


  return Membership.findOne({

    userId,

    tenantId,

  });

}


// =====================================================
// REQUIRE MEMBERSHIP
// =====================================================

async function requireMembership(
  req,
  res
) {

  const membership =
    await loadMembership(
      req
    );


  if (
    !membership
  ) {

    res
      .status(403)
      .json({

        error:
          "Not a member of this tenant",

      });


    return null;

  }


  return membership;

}


// =====================================================
// EXPIRE WAITING CALLS
// =====================================================
//
// Queue calls only.
//
// Targeted calls use "ringing" and therefore remain
// outside this expiry process for now.
//
// =====================================================

async function expireWaitingCalls(
  tenantId
) {

  const expiryDate =
    new Date(
      Date.now() -
      WAITING_CALL_EXPIRY_MINUTES *
      60 *
      1000
    );


  const result =
    await Call.updateMany(

      {

        tenantId,

        status:
          "waiting",

        createdAt: {
          $lt:
            expiryDate,
        },

      },

      {

        $set: {

          status:
            "expired",

          expiredAt:
            new Date(),

        },

      }

    );


  if (
    result.modifiedCount >
    0
  ) {

    console.log(
      "[Calls] Expired waiting calls",
      {

        tenantId:
          String(
            tenantId
          ),

        count:
          result.modifiedCount,

      }
    );

  }


  return result.modifiedCount;

}


// =====================================================
// ENRICH QUEUE CALLS WITH CLIENT USER
// =====================================================

async function enrichCallsWithClients(
  calls
) {

  if (
    !Array.isArray(calls) ||
    calls.length === 0
  ) {

    return [];

  }


  const clientIds = [

    ...new Set(

      calls
        .map(
          call =>
            call?.clientUserId
              ? String(
                  call.clientUserId
                )
              : null
        )
        .filter(Boolean)

    ),

  ];


  if (
    clientIds.length === 0
  ) {

    return calls;

  }


  const users =
    await User.find({

      _id: {
        $in:
          clientIds,
      },

    })
      .select(
        "email firstName lastName"
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


  return calls.map(
    call => ({

      ...call,

      client:
        userMap.get(
          String(
            call.clientUserId
          )
        ) ||
        null,

    })
  );

}


// =====================================================
// CREATE CALL
// =====================================================
//
// POST /api/calls
//
// Queue:
//
//   { recipientId: null }
//
// Targeted:
//
//   { recipientId: "<User._id>" }
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

      // =================================================
      // CALLER MEMBERSHIP
      // =================================================

      const membership =
        await requireMembership(
          req,
          res
        );


      if (
        !membership
      ) {

        return;

      }


      // =================================================
      // CALLER PERMISSION
      // =================================================

      if (
        !canCreateCall(
          membership
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              `Not allowed to create calls (role=${membership.role})`,

          });

      }


      // =================================================
      // RECIPIENT
      // =================================================

      const recipientId =
        req.body?.recipientId ||
        null;


      let recipientUserId =
        null;


      if (
        recipientId
      ) {

        // -------------------------------------------------
        // VALIDATE OBJECT ID
        // -------------------------------------------------

        if (
          !isValidObjectId(
            recipientId
          )
        ) {

          return res
            .status(400)
            .json({

              error:
                "Invalid recipientId",

            });

        }


        console.log(
          "[Calls] Targeted recipient lookup",
          {

            recipientId,

            callerUserId:
              req.user.userId,

            tenantId:
              req.user.tenantId,

          }
        );


        // -------------------------------------------------
        // FIND USER
        // -------------------------------------------------

        const recipient =
          await User.findById(
            recipientId
          )
            .select(
              "_id firstName lastName email"
            )
            .lean();


        console.log(
          "[Calls] Targeted recipient lookup result",
          recipient
        );


        if (
          !recipient
        ) {

          return res
            .status(404)
            .json({

              error:
                "Recipient user not found",

            });

        }


        // -------------------------------------------------
        // VERIFY TENANT MEMBERSHIP
        // -------------------------------------------------

        const recipientMembership =
          await Membership.findOne({

            userId:
              recipient._id,

            tenantId:
              req.user.tenantId,

          })
            .select(
              "_id userId tenantId role"
            )
            .lean();


        if (
          !recipientMembership
        ) {

          return res
            .status(403)
            .json({

              error:
                "Recipient is not a member of this tenant",

            });

        }


        recipientUserId =
          recipient._id;


        console.log(
          "[Calls] Targeted recipient verified",
          {

            recipientUserId:
              String(
                recipient._id
              ),

            recipientName:
              `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim(),

            recipientEmail:
              recipient.email,

            recipientRole:
              recipientMembership.role,

            tenantId:
              String(
                req.user.tenantId
              ),

          }
        );

      }


      // =================================================
      // CHANNEL
      // =================================================

      const channelName =
        makeChannelName({

          tenantId:
            req.user.tenantId,

          userId:
            req.user.userId,

        });


      // =================================================
      // CREATE CALL
      // =================================================

      const call =
        await Call.create({

          tenantId:
            req.user.tenantId,

          clientUserId:
            req.user.userId,

          recipientUserId,

          channelName,

          status:
            recipientUserId
              ? "ringing"
              : "waiting",

        });


      console.log(
        "[Calls] Call created",
        {

          callId:
            String(
              call._id
            ),

          clientUserId:
            String(
              call.clientUserId
            ),

          recipientUserId:
            call.recipientUserId
              ? String(
                  call.recipientUserId
                )
              : null,

          status:
            call.status,

          channelName:
            call.channelName,

        }
      );


      return res
        .status(201)
        .json({

          ok:
            true,

          call,

        });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Create call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to create call",

        });

    }

  }
);


// =====================================================
// GET AVAILABLE QUEUE CALLS
// =====================================================
//
// GET /api/calls/available
//
// Targeted ringing calls never appear here.
//
// =====================================================

router.get(
  "/available",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const membership =
        await requireMembership(
          req,
          res
        );


      if (
        !membership
      ) {

        return;

      }


      if (
        !canAcceptCall(
          membership
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not allowed to view available calls",

          });

      }


      // =================================================
      // AVAILABILITY
      // =================================================

      if (
        !membership.isAvailable
      ) {

        return res.json({

          ok:
            true,

          calls: [],

        });

      }


      // =================================================
      // EXPIRE OLD WAITING CALLS
      // =================================================

      await expireWaitingCalls(
        req.user.tenantId
      );


      // =================================================
      // FETCH QUEUE
      // =================================================

      const calls =
        await Call.find({

          tenantId:
            req.user.tenantId,

          status:
            "waiting",

          claimedByUserId:
            null,

        })
          .sort({

            createdAt:
              -1,

          })
          .limit(
            MAX_AVAILABLE_CALLS
          )
          .lean();


      const enriched =
        await enrichCallsWithClients(
          calls
        );


      console.log(
        "[Calls] Available queue loaded",
        {

          userId:
            String(
              req.user.userId
            ),

          count:
            enriched.length,

        }
      );


      return res.json({

        ok:
          true,

        calls:
          enriched,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Get available calls failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load available calls",

        });

    }

  }
);


// =====================================================
// GET TARGETED CALL INVITATIONS
// =====================================================
//
// GET /api/calls/pending
//
// Only calls specifically addressed to the authenticated
// user are returned.
//
// The caller/trainer is also included so the client can
// display who invited them.
// =====================================================

router.get(
  "/pending",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const calls =
        await Call.find({

          tenantId:
            req.user.tenantId,

          recipientUserId:
            req.user.userId,

          status:
            "ringing",

        })
          .sort({
            createdAt:
              -1,
          })
          .limit(
            MAX_PENDING_CALLS
          )
          .lean();


      // =================================================
      // LOAD TRAINERS
      // =================================================

      const trainerIds = [
        ...new Set(
          calls
            .map(
              call =>
                call?.clientUserId
                  ? String(
                      call.clientUserId
                    )
                  : null
            )
            .filter(Boolean)
        ),
      ];


      let trainerMap =
        new Map();


      if (
        trainerIds.length > 0
      ) {

        const trainers =
          await User.find({

            _id: {
              $in:
                trainerIds,
            },

          })
            .select(
              "_id firstName lastName email"
            )
            .lean();


        trainerMap =
          new Map(
            trainers.map(
              trainer => [
                String(
                  trainer._id
                ),
                trainer,
              ]
            )
          );

      }


      // =================================================
      // ENRICH INVITATIONS
      // =================================================

      const enrichedCalls =
        calls.map(
          call => ({

            ...call,

            trainer:
              trainerMap.get(
                String(
                  call.clientUserId
                )
              ) ||
              null,

          })
        );


      console.log(
        "[Calls] Pending invitations loaded",
        {

          userId:
            String(
              req.user.userId
            ),

          count:
            enrichedCalls.length,

        }
      );


      return res.json({

        ok:
          true,

        calls:
          enrichedCalls,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Get pending calls failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load pending calls",

        });

    }

  }
);

// =====================================================
// GET CALL STATUS
// =====================================================
//
// GET /api/calls/:callId
//
// Used by connected clients to detect when a training
// session has ended.
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

      const {
        callId,
      } =
        req.params;


      if (
        !isValidObjectId(
          callId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid callId",

          });

      }


      const call =
        await Call.findOne({

          _id:
            callId,

          tenantId:
            req.user.tenantId,

        })
          .lean();


      if (
        !call
      ) {

        return res
          .status(404)
          .json({

            error:
              "Call not found",

          });

      }


      // =================================================
      // AUTHORISATION
      // =================================================

      const membership =
        await requireMembership(
          req,
          res
        );


      if (
        !membership
      ) {

        return;

      }


      const isOwnerAdmin =
        membership.role === "owner" ||
        membership.role === "admin";


      const isCreator =
        String(
          call.clientUserId
        ) ===
        String(
          req.user.userId
        );


      const isRecipient =
        call.recipientUserId &&
        String(
          call.recipientUserId
        ) ===
        String(
          req.user.userId
        );


      const isClaimedEmployee =
        call.claimedByUserId &&
        String(
          call.claimedByUserId
        ) ===
        String(
          req.user.userId
        );


      if (
        !isOwnerAdmin &&
        !isCreator &&
        !isRecipient &&
        !isClaimedEmployee
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not allowed to view this call",

          });

      }


      return res.json({

        ok:
          true,

        call,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Get call status failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load call status",

        });

    }

  }
);


// =====================================================
// JOIN TARGETED CALL
// =====================================================
//
// POST /api/calls/:callId/join
//
// Only the designated recipient can perform this action.
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

      const {
        callId,
      } =
        req.params;


      if (
        !isValidObjectId(
          callId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid callId",

          });

      }


      // =================================================
      // FIND TARGETED INVITATION
      // =================================================

      const call =
        await Call.findOne({

          _id:
            callId,

          tenantId:
            req.user.tenantId,

          recipientUserId:
            req.user.userId,

          status:
            "ringing",

        });


      if (
        !call
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "CALL_NOT_AVAILABLE",

            message:
              "This training invitation is no longer available.",

          });

      }


      // =================================================
      // ACTIVATE TARGETED CALL
      // =================================================

      call.status =
        "active";


      call.claimedByUserId =
        req.user.userId;


      call.claimedAt =
        new Date();


      await call.save();


      console.log(
        "[Calls] Targeted call joined",
        {

          callId:
            String(
              call._id
            ),

          recipientUserId:
            String(
              req.user.userId
            ),

          channel:
            call.channelName,

        }
      );


      return res.json({

        ok:
          true,

        call,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Join targeted call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to join training invitation",

        });

    }

  }
);


// =====================================================
// ACCEPT QUEUE CALL
// =====================================================
//
// POST /api/calls/:callId/accept
//
// Atomic claim of a waiting queue call.
//
// Targeted ringing calls cannot be accepted here.
//
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

      const membership =
        await requireMembership(
          req,
          res
        );


      if (
        !membership
      ) {

        return;

      }


      if (
        !canAcceptCall(
          membership
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not allowed to accept calls",

          });

      }


      const {
        callId,
      } =
        req.params;


      if (
        !isValidObjectId(
          callId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid callId",

          });

      }


      // =================================================
      // ATOMIC CLAIM
      // =================================================

      const call =
        await Call.findOneAndUpdate(

          {

            _id:
              callId,

            tenantId:
              req.user.tenantId,

            status:
              "waiting",

            claimedByUserId:
              null,

          },

          {

            $set: {

              status:
                "claimed",

              claimedByUserId:
                req.user.userId,

              claimedAt:
                new Date(),

            },

          },

          {

            new:
              true,

          }

        );


      if (
        !call
      ) {

        return res
          .status(409)
          .json({

            ok:
              false,

            error:
              "CALL_NOT_AVAILABLE",

            message:
              "This call is no longer available",

          });

      }


      console.log(
        "[Calls] Queue call accepted",
        {

          callId:
            String(
              call._id
            ),

          acceptedBy:
            String(
              req.user.userId
            ),

          channel:
            call.channelName,

        }
      );


      return res.json({

        ok:
          true,

        call,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Accept call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to accept call",

        });

    }

  }
);


// =====================================================
// RELEASE CLAIMED QUEUE CALL
// =====================================================
//
// POST /api/calls/:callId/release
//
// =====================================================

router.post(
  "/:callId/release",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const membership =
        await requireMembership(
          req,
          res
        );


      if (
        !membership
      ) {

        return;

      }


      if (
        !canAcceptCall(
          membership
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not allowed to release calls",

          });

      }


      const {
        callId,
      } =
        req.params;


      if (
        !isValidObjectId(
          callId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid callId",

          });

      }


      // =================================================
      // ATOMIC RELEASE
      // =================================================

      const call =
        await Call.findOneAndUpdate(

          {

            _id:
              callId,

            tenantId:
              req.user.tenantId,

            status:
              "claimed",

            claimedByUserId:
              req.user.userId,

          },

          {

            $set: {

              status:
                "waiting",

            },

            $unset: {

              claimedByUserId:
                "",

              claimedAt:
                "",

            },

          },

          {

            new:
              true,

          }

        );


      if (
        !call
      ) {

        return res
          .status(409)
          .json({

            error:
              "Call is no longer claimed by this user",

          });

      }


      console.log(
        "[Calls] Queue call released",
        {

          callId:
            String(
              call._id
            ),

          releasedBy:
            String(
              req.user.userId
            ),

        }
      );


      return res.json({

        ok:
          true,

        call,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] Release call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to release call",

        });

    }

  }
);


// =====================================================
// END CALL
// =====================================================
//
// POST /api/calls/:callId/end
//
// Allowed:
//
// - owner/admin
// - original creator
// - claimed queue employee
// - targeted recipient
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

      const membership =
        await requireMembership(
          req,
          res
        );


      if (
        !membership
      ) {

        return;

      }


      const {
        callId,
      } =
        req.params;


      if (
        !isValidObjectId(
          callId
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid callId",

          });

      }


      const call =
        await Call.findOne({

          _id:
            callId,

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
              "Call not found",

          });

      }


      const isOwnerAdmin =
        membership.role === "owner" ||
        membership.role === "admin";


      const isClientCreator =
        String(
          call.clientUserId
        ) ===
        String(
          req.user.userId
        );


      const isClaimedEmployee =
        Boolean(
          call.claimedByUserId
        ) &&
        String(
          call.claimedByUserId
        ) ===
        String(
          req.user.userId
        );


      const isTargetedRecipient =
        Boolean(
          call.recipientUserId
        ) &&
        String(
          call.recipientUserId
        ) ===
        String(
          req.user.userId
        );


      const allowed =
        isOwnerAdmin ||
        isClientCreator ||
        isClaimedEmployee ||
        isTargetedRecipient;


      if (
        !allowed
      ) {

        return res
          .status(403)
          .json({

            error:
              "Not allowed to end this call",

          });

      }


      // =================================================
      // ALREADY ENDED
      // =================================================

      if (
        call.status === "ended"
      ) {

        return res.json({

          ok:
            true,

          call,

          alreadyEnded:
            true,

        });

      }


      call.status =
        "ended";


      call.endedAt =
        new Date();


      await call.save();


      console.log(
        "[Calls] Call ended",
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


      return res.json({

        ok:
          true,

        call,

      });

    }
    catch (
      error
    ) {

      console.error(
        "[Calls] End call failed",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to end call",

        });

    }

  }
);


export default router;