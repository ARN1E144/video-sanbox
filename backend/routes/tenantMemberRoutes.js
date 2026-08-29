// backend/routes/tenantMembers.js

import express from "express";

import Membership from "../models/Membership.js";
import User from "../models/User.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import requireTenant from "../middleware/requireTenant.js";


const router =
  express.Router();


// =====================================================
// GET TENANT MEMBERS
// =====================================================
//
// GET /api/data/members
//
// Query:
//
//   search
//   page
//   limit
//   role
//
// Examples:
//
//   /api/data/members
//   /api/data/members?search=bob
//   /api/data/members?page=2&limit=25
//
// Results are paginated so large tenants do not require
// loading thousands of users into the browser.
// =====================================================

router.get(
  "/members",
  requireAuth,
  requireTenant,
  async (
    req,
    res
  ) => {

    try {

      const tenantId =
        req.user.tenantId;


      const search =
        String(
          req.query.search ||
          ""
        ).trim();


      const requestedPage =
        Number(
          req.query.page ||
          1
        );


      const requestedLimit =
        Number(
          req.query.limit ||
          25
        );


      const role =
        String(
          req.query.role ||
          ""
        ).trim();


      const page =
        Number.isFinite(
          requestedPage
        ) && requestedPage > 0
          ? Math.floor(
              requestedPage
            )
          : 1;


      const limit =
        Number.isFinite(
          requestedLimit
        )
          ? Math.min(
              Math.max(
                Math.floor(
                  requestedLimit
                ),
                1
              ),
              100
            )
          : 25;


      const skip =
        (page - 1) *
        limit;


      // =================================================
      // MEMBERSHIP QUERY
      // =================================================

      const membershipQuery = {

        tenantId,

      };


      if (
        role
      ) {

        membershipQuery.role =
          role;

      }


      const memberships =
        await Membership.find(
          membershipQuery
        )
          .select(
            "userId role isAvailable"
          )
          .lean();


      if (
        memberships.length === 0
      ) {

        return res.json({

          ok:
            true,

          members: [],

          pagination: {

            page,

            limit,

            total:
              0,

            totalPages:
              0,

            hasNext:
              false,

          },

        });

      }


      const userIds =
        memberships.map(
          membership =>
            membership.userId
        );


      // =================================================
      // USER SEARCH
      // =================================================

      const userQuery = {

        _id: {
          $in:
            userIds,
        },

      };


      if (
        search
      ) {

        const escapedSearch =
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );


        const searchRegex =
          new RegExp(
            escapedSearch,
            "i"
          );


        userQuery.$or = [

          {
            firstName:
              searchRegex,
          },

          {
            lastName:
              searchRegex,
          },

          {
            email:
              searchRegex,
          },

        ];

      }


      // =================================================
      // MATCHING USER COUNT
      // =================================================

      const total =
        await User.countDocuments(
          userQuery
        );


      // =================================================
      // USERS
      // =================================================

      const users =
        await User.find(
          userQuery
        )
          .select(
            "_id firstName lastName email"
          )
          .sort({

            firstName:
              1,

            lastName:
              1,

            email:
              1,

          })
          .skip(
            skip
          )
          .limit(
            limit
          )
          .lean();


      // =================================================
      // MEMBERSHIP MAP
      // =================================================

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


      // =================================================
      // RESPONSE
      // =================================================

      const members =
        users.map(
          user => {

            const membership =
              membershipMap.get(
                String(
                  user._id
                )
              );


            return {

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

              role:
                membership?.role ||
                null,

              isAvailable:
                Boolean(
                  membership?.isAvailable
                ),

            };

          }
        );


      const totalPages =
        total > 0
          ? Math.ceil(
              total /
              limit
            )
          : 0;


      return res.json({

        ok:
          true,

        members,

        pagination: {

          page,

          limit,

          total,

          totalPages,

          hasNext:
            page <
            totalPages,

        },

      });

    }
    catch (
      error
    ) {

      console.error(
        "[TenantMembers] Failed to load members",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Failed to load tenant members",

        });

    }

  }
);


export default router;