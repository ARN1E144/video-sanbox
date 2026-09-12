import express from "express";
import mongoose from "mongoose";

import ChatConversation
  from "../models/chatConversation.js";

import ChatMessage
  from "../models/chatMessage.js";

import {
  requireAuth,
  getProjectAccess,
} from "../middleware/projectAccess.js";


const router =
  express.Router();


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


  const result =
    String(
      value
    ).trim();


  return result ||
    null;

}


// =====================================================
// PROJECT ID
// =====================================================

function getProjectId(
  req
) {

  return (

    req.params?.projectId ||

    req.query?.projectId ||

    req.body?.projectId ||

    null

  );

}


// =====================================================
// PROJECT ACCESS
// =====================================================

async function requireChatProject(
  req,
  res
) {

  const projectId =
    getProjectId(
      req
    );


  if (
    !projectId
  ) {

    return {

      error:
        res.status(400).json({

          error:
            "projectId is required",

        }),

    };

  }


  if (
    !mongoose.Types.ObjectId.isValid(
      projectId
    )
  ) {

    return {

      error:
        res.status(400).json({

          error:
            "Invalid projectId",

        }),

    };

  }


  const access =
    await getProjectAccess(

      req,

      projectId,

      "canView"

    );


  if (
    !access.allowed
  ) {

    return {

      error:
        res.status(
          access.status ||
          403
        ).json({

          error:
            access.error ||
            "You do not have access to this project",

        }),

    };

  }


  return {

    projectId,

    project:
      access.project,

    membership:
      access.membership,

  };

}


// =====================================================
// CURRENT USER
// =====================================================

function getCurrentUser(
  req
) {

  const user =
    req.user ||
    {};


  return {

    userId:
      normaliseId(
        user.userId ||
        user.id
      ),

    name:
      user.name ||
      user.displayName ||
      user.fullName ||
      user.email ||
      "Unknown user",

    email:
      user.email ||
      "",

  };

}


// =====================================================
// FIND PARTICIPANT
// =====================================================

function findParticipant(
  conversation,
  userId
) {

  return (
    conversation?.participants?.find(
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
// REQUIRE PARTICIPANT
// =====================================================

function requireParticipant(
  conversation,
  userId,
  res
) {

  const participant =
    findParticipant(
      conversation,
      userId
    );


  if (
    !participant
  ) {

    res.status(403).json({

      error:
        "You are not a participant in this conversation",

    });


    return null;

  }


  return participant;

}


// =====================================================
// GET SOCKET NAMESPACE
// =====================================================

function getChatNamespace(
  req
) {

  const io =
    req.app.get(
      "io"
    );


  return io?.of(
    "/group-calls"
  ) || null;

}


// =====================================================
// GET CHAT ROOM
// =====================================================

function getChatRoom(
  conversationId
) {

  return (
    `chat:${String(
      conversationId
    )}`
  );

}


// =====================================================
// EMIT CHAT EVENT
// =====================================================

function emitChatEvent(
  req,
  event,
  conversationId,
  payload = {}
) {

  const namespace =
    getChatNamespace(
      req
    );


  if (
    !namespace
  ) {

    return;

  }


  namespace
    .to(
      getChatRoom(
        conversationId
      )
    )
    .emit(
      event,
      {

        ...payload,

        conversationId:
          normaliseId(
            conversationId
          ),

      }
    );

}


// =====================================================
// EMIT USER EVENT
// =====================================================

function emitUserEvent(
  req,
  userId,
  event,
  payload = {}
) {

  const namespace =
    getChatNamespace(
      req
    );


  if (
    !namespace
  ) {

    return;

  }


  const normalisedUserId =
    normaliseId(
      userId
    );


  if (
    !normalisedUserId
  ) {

    return;

  }


  namespace
    .to(
      `user:${normalisedUserId}`
    )
    .emit(
      event,
      {

        ...payload,

        userId:
          normalisedUserId,

      }
    );

}


// =====================================================
// SERIALISE CONVERSATION
// =====================================================

function serialiseConversation(
  conversation
) {

  return {

    id:
      conversation._id,

    projectId:
      conversation.projectId,

    tenantId:
      conversation.tenantId,

    title:
      conversation.title,

    type:
      conversation.type,

    status:
      conversation.status,

    createdByUserId:
      conversation.createdByUserId,

    participants:
      conversation.participants ||
      [],

    lastMessage:
      conversation.lastMessage ||
      null,

    createdAt:
      conversation.createdAt,

    updatedAt:
      conversation.updatedAt,

  };

}


// =====================================================
// GET CONVERSATIONS
// =====================================================
//
// GET /api/chat/conversations?projectId=<id>
//
// =====================================================

router.get(
  "/conversations",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversations =
        await ChatConversation.find({

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

          participants: {

            $elemMatch: {

              userId:
                currentUser.userId,

              status: {

                $in: [

                  "invited",

                  "active",

                ],

              },

            },

          },

        })
          .sort({
            updatedAt:
              -1,
          });


      return res.json({

        projectId:
          access.projectId,

        conversations:
          conversations.map(
            serialiseConversation
          ),

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to load conversations",
        error
      );


      return res.status(500).json({

        error:
          "Failed to load conversations",

      });

    }

  }
);


// =====================================================
// CREATE CONVERSATION
// =====================================================
//
// POST /api/chat/conversations
//
// body:
//
// {
//   projectId,
//   title,
//   type,
//   participantIds: []
// }
//
// =====================================================

router.post(
  "/conversations",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      if (
        !currentUser.userId
      ) {

        return res.status(401).json({

          error:
            "Authenticated user could not be resolved",

        });

      }


      const requestedParticipantIds =
        Array.isArray(
          req.body?.participantIds
        )
          ? req.body.participantIds
          : [];


      const uniqueParticipantIds =
        [
          currentUser.userId,
          ...requestedParticipantIds,
        ]
          .map(
            normaliseId
          )
          .filter(
            Boolean
          )
          .filter(
            (
              value,
              index,
              array
            ) =>
              array.indexOf(
                value
              ) ===
              index
          );


      if (
        uniqueParticipantIds.length <
        2
      ) {

        return res.status(400).json({

          error:
            "At least one other participant is required",

        });

      }


      const requestedType =
        req.body?.type ||
        (
          uniqueParticipantIds.length ===
          2
            ? "direct"
            : "group"
        );


      if (
        ![
          "direct",
          "group",
        ].includes(
          requestedType
        )
      ) {

        return res.status(400).json({

          error:
            "Invalid conversation type",

        });

      }


      const now =
        new Date();


      const conversation =
        await ChatConversation.create({

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

          title:
            String(
              req.body?.title ||
              ""
            ).trim(),

          type:
            requestedType,

          status:
            "active",

          createdByUserId:
            currentUser.userId,

          participants:

            uniqueParticipantIds.map(
              userId => ({

                userId,

                name:
                  userId ===
                  currentUser.userId
                    ? currentUser.name
                    : "",

                email:
                  userId ===
                  currentUser.userId
                    ? currentUser.email
                    : "",

                status:
                  userId ===
                  currentUser.userId
                    ? "active"
                    : "invited",

                invitedByUserId:
                  userId ===
                  currentUser.userId
                    ? null
                    : currentUser.userId,

                invitedAt:
                  userId ===
                  currentUser.userId
                    ? null
                    : now,

                joinedAt:
                  userId ===
                  currentUser.userId
                    ? now
                    : null,

                leftAt:
                  null,

              })
            ),

        });


      // =================================================
      // REALTIME INVITATIONS
      // =================================================

      conversation.participants
        .filter(
          participant =>
            participant.status ===
            "invited"
        )
        .forEach(
          participant => {

            emitUserEvent(

              req,

              participant.userId,

              "chat:invited",

              {

                conversationId:
                  conversation._id,

                projectId:
                  access.projectId,

                invitedBy:
                  currentUser.userId,

                title:
                  conversation.title,

                type:
                  conversation.type,

              }

            );

          }
        );


      return res.status(201).json({

        conversation:
          serialiseConversation(
            conversation
          ),

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to create conversation",
        error
      );


      return res.status(500).json({

        error:
          "Failed to create conversation",

      });

    }

  }
);


// =====================================================
// GET CONVERSATION
// =====================================================

router.get(
  "/conversations/:conversationId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      const currentUser =
        getCurrentUser(
          req
        );


      if (
        !requireParticipant(
          conversation,
          currentUser.userId,
          res
        )
      ) {

        return;

      }


      return res.json({

        conversation:
          serialiseConversation(
            conversation
          ),

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to load conversation",
        error
      );


      return res.status(500).json({

        error:
          "Failed to load conversation",

      });

    }

  }
);


// =====================================================
// GET MESSAGES
// =====================================================

router.get(
  "/conversations/:conversationId/messages",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      const currentUser =
        getCurrentUser(
          req
        );


      if (
        !requireParticipant(
          conversation,
          currentUser.userId,
          res
        )
      ) {

        return;

      }


      const limit =
        Math.min(
          Math.max(
            Number(
              req.query?.limit
            ) || 50,
            1
          ),
          200
        );


      const messages =
        await ChatMessage.find({

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

          conversationId:
            conversation._id,

        })
          .sort({
            createdAt:
              1,
          })
          .limit(
            limit
          );


      return res.json({

        conversationId:
          conversation._id,

        messages,

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to load messages",
        error
      );


      return res.status(500).json({

        error:
          "Failed to load messages",

      });

    }

  }
);


// =====================================================
// SEND MESSAGE
// =====================================================

router.post(
  "/conversations/:conversationId/messages",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const text =
        String(
          req.body?.text ??
          ""
        ).trim();


      if (
        !text
      ) {

        return res.status(400).json({

          error:
            "Message text is required",

        });

      }


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      const participant =
        requireParticipant(
          conversation,
          currentUser.userId,
          res
        );


      if (
        !participant
      ) {

        return;

      }


      if (
        participant.status !==
        "active"
      ) {

        return res.status(403).json({

          error:
            "You must be an active participant to send messages",

        });

      }


      if (
        conversation.status !==
        "active"
      ) {

        return res.status(409).json({

          error:
            "Conversation is closed",

        });

      }


      const message =
        await ChatMessage.create({

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

          conversationId:
            conversation._id,

          senderUserId:
            currentUser.userId,

          senderName:
            currentUser.name,

          senderEmail:
            currentUser.email,

          text,

        });


      conversation.lastMessage = {

        messageId:
          message._id,

        text:
          message.text,

        senderUserId:
          message.senderUserId,

        createdAt:
          message.createdAt,

      };


      await conversation.save();


      // =================================================
      // REALTIME
      // =================================================

      emitChatEvent(

        req,

        conversation._id,

        "chat:message",

        {

          message,

        }

      );


      return res.status(201).json({

        message,

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to send message",
        error
      );


      return res.status(500).json({

        error:
          "Failed to send message",

      });

    }

  }
);


// =====================================================
// EDIT MESSAGE
// =====================================================

router.patch(
  "/conversations/:conversationId/messages/:messageId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      if (
        !requireParticipant(
          conversation,
          currentUser.userId,
          res
        )
      ) {

        return;

      }


      if (
        conversation.status !==
        "active"
      ) {

        return res.status(409).json({

          error:
            "Conversation is closed",

        });

      }


      const message =
        await ChatMessage.findOne({

          _id:
            req.params.messageId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

          conversationId:
            req.params.conversationId,

        });


      if (
        !message
      ) {

        return res.status(404).json({

          error:
            "Message not found",

        });

      }


      if (
        String(
          message.senderUserId
        ) !==
        String(
          currentUser.userId
        )
      ) {

        return res.status(403).json({

          error:
            "Only the message sender can edit this message",

        });

      }


      if (
        message.deletedAt
      ) {

        return res.status(409).json({

          error:
            "Deleted messages cannot be edited",

        });

      }


      const text =
        String(
          req.body?.text ??
          ""
        ).trim();


      if (
        !text
      ) {

        return res.status(400).json({

          error:
            "Message text is required",

        });

      }


      message.text =
        text;

      message.editedAt =
        new Date();


      await message.save();


      if (
        conversation?.lastMessage?.messageId &&
        String(
          conversation.lastMessage.messageId
        ) ===
          String(
            message._id
          )
      ) {

        conversation.lastMessage.text =
          message.text;

        await conversation.save();

      }


      // =================================================
      // IMPORTANT
      // =================================================
      //
      // Must match the client socket service:
      //
      // chat:message-updated
      //
      // =================================================

      emitChatEvent(

        req,

        conversation._id,

        "chat:message-updated",

        {

          message,

        }

      );


      return res.json({

        message,

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to edit message",
        error
      );


      return res.status(500).json({

        error:
          "Failed to edit message",

      });

    }

  }
);


// =====================================================
// DELETE MESSAGE
// =====================================================

router.delete(
  "/conversations/:conversationId/messages/:messageId",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      if (
        !requireParticipant(
          conversation,
          currentUser.userId,
          res
        )
      ) {

        return;

      }


      const message =
        await ChatMessage.findOne({

          _id:
            req.params.messageId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

          conversationId:
            req.params.conversationId,

        });


      if (
        !message
      ) {

        return res.status(404).json({

          error:
            "Message not found",

        });

      }


      if (
        String(
          message.senderUserId
        ) !==
        String(
          currentUser.userId
        )
      ) {

        return res.status(403).json({

          error:
            "Only the message sender can delete this message",

        });

      }


      if (
        !message.deletedAt
      ) {

        message.deletedAt =
          new Date();

        message.deletedByUserId =
          currentUser.userId;

        await message.save();

      }


      emitChatEvent(

        req,

        conversation._id,

        "chat:message-deleted",

        {

          messageId:
            message._id,

          deletedAt:
            message.deletedAt,

        }

      );


      return res.json({

        ok:
          true,

        messageId:
          message._id,

        deletedAt:
          message.deletedAt,

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to delete message",
        error
      );


      return res.status(500).json({

        error:
          "Failed to delete message",

      });

    }

  }
);


// =====================================================
// ACCEPT INVITATION
// =====================================================

router.post(
  "/conversations/:conversationId/accept",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      const participant =
        findParticipant(
          conversation,
          currentUser.userId
        );


      if (
        !participant
      ) {

        return res.status(403).json({

          error:
            "You are not invited to this conversation",

        });

      }


      if (
        participant.status ===
        "active"
      ) {

        return res.json({

          conversation:
            serialiseConversation(
              conversation
            ),

        });

      }


      participant.status =
        "active";

      participant.joinedAt =
        new Date();

      participant.leftAt =
        null;


      conversation.status =
        "active";


      await conversation.save();


      // =================================================
      // NOTIFY EXISTING PARTICIPANTS
      // =================================================

      emitChatEvent(

        req,

        conversation._id,

        "chat:participant-joined",

        {

          userId:
            currentUser.userId,

          joinedAt:
            participant.joinedAt,

        }

      );


      return res.json({

        conversation:
          serialiseConversation(
            conversation
          ),

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to accept chat invitation",
        error
      );


      return res.status(500).json({

        error:
          "Failed to accept chat invitation",

      });

    }

  }
);


// =====================================================
// DECLINE INVITATION
// =====================================================

router.post(
  "/conversations/:conversationId/decline",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      const participant =
        findParticipant(
          conversation,
          currentUser.userId
        );


      if (
        !participant
      ) {

        return res.status(403).json({

          error:
            "You are not a participant in this conversation",

        });

      }


      participant.status =
        "declined";


      await conversation.save();


      return res.json({

        ok:
          true,

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to decline chat invitation",
        error
      );


      return res.status(500).json({

        error:
          "Failed to decline chat invitation",

      });

    }

  }
);


// =====================================================
// LEAVE CONVERSATION
// =====================================================

router.post(
  "/conversations/:conversationId/leave",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      const participant =
        findParticipant(
          conversation,
          currentUser.userId
        );


      if (
        !participant
      ) {

        return res.status(403).json({

          error:
            "You are not a participant in this conversation",

        });

      }


      participant.status =
        "left";

      participant.leftAt =
        new Date();


      const remainingActive =
        conversation.participants.filter(
          item =>
            item.status ===
            "active"
        ).length;


      if (
        remainingActive ===
        0
      ) {

        conversation.status =
          "closed";

      }


      await conversation.save();


      emitChatEvent(

        req,

        conversation._id,

        "chat:participant-left",

        {

          userId:
            currentUser.userId,

          leftAt:
            participant.leftAt,

        }

      );


      return res.json({

        conversation:
          serialiseConversation(
            conversation
          ),

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to leave conversation",
        error
      );


      return res.status(500).json({

        error:
          "Failed to leave conversation",

      });

    }

  }
);


// =====================================================
// CLOSE CONVERSATION
// =====================================================
//
// Creator-only V1 close operation.
//
// =====================================================

router.post(
  "/conversations/:conversationId/close",
  requireAuth,
  async (
    req,
    res
  ) => {

    try {

      const access =
        await requireChatProject(
          req,
          res
        );


      if (
        access.error
      ) {

        return;

      }


      const currentUser =
        getCurrentUser(
          req
        );


      const conversation =
        await ChatConversation.findOne({

          _id:
            req.params.conversationId,

          tenantId:
            req.user.tenantId,

          projectId:
            access.projectId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          error:
            "Conversation not found",

        });

      }


      if (
        String(
          conversation.createdByUserId
        ) !==
        String(
          currentUser.userId
        )
      ) {

        return res.status(403).json({

          error:
            "Only the conversation creator can close this conversation",

        });

      }


      conversation.status =
        "closed";


      await conversation.save();


      // =================================================
      // IMPORTANT
      // =================================================
      //
      // Must match the client socket service:
      //
      // chat:conversation-closed
      //
      // =================================================

      emitChatEvent(

        req,

        conversation._id,

        "chat:conversation-closed",

        {

          closedBy:
            currentUser.userId,

          closedAt:
            new Date(),

        }

      );


      return res.json({

        conversation:
          serialiseConversation(
            conversation
          ),

      });

    }
    catch (error) {

      console.error(
        "[CHAT] Failed to close conversation",
        error
      );


      return res.status(500).json({

        error:
          "Failed to close conversation",

      });

    }

  }
);


export default router;