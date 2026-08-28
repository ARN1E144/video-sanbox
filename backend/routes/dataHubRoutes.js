// backend/routes/dataHubRoutes.js

import express from "express";


// =====================================================
// CONTROLLERS
// =====================================================
//
// These controllers contain the actual Data Hub logic.
// The routes are responsible for:
//
// 1. Authentication
// 2. Project-level permission checks
// 3. Routing the request
//
// =====================================================

import {
  getAccessibleProjects,
  getProjectDataSummary,
  getProjectInterviews,
  getProjectRecordings,
  getProjectEvaluations,
  getProjectTranscriptions,

} from "../controllers/dataHubController.js";


// =====================================================
// PROJECT ACCESS
// =====================================================
//
// Reuse the existing project security layer.
//
// `requireAuth`:
//
//     verifies JWT
//     ↓
//     populates req.user
//
// `requireProjectPermission`:
//
//     verifies:
//     tenant
//     project membership
//     project permission
//
// =====================================================

import {
  requireAuth,
  requireProjectPermission,
} from "../middleware/projectAccess.js";


const router =
  express.Router();


// =====================================================
// GET ACCESSIBLE PROJECTS
// =====================================================
//
// GET
// /api/data/projects
//
// Purpose:
//
// Return the projects that the authenticated user can
// access through their project memberships.
//
// IMPORTANT:
//
// We do NOT use requireProjectPermission() here because
// there is no single project ID yet.
//
// The controller should perform the membership query for
// the authenticated user.
//
// =====================================================

router.get(
  "/projects",

  requireAuth,

  getAccessibleProjects
);


// =====================================================
// GET PROJECT DATA SUMMARY
// =====================================================
//
// GET
// /api/data/projects/:projectId
//
// Returns a summary such as:
//
// project
// role
// permissions
// available resources
// record counts
//
// `canView` is the minimum project permission required.
//
// =====================================================

router.get(
  "/projects/:projectId",

  requireAuth,

  requireProjectPermission(
    "canView"
  ),

  getProjectDataSummary
);


// =====================================================
// GET PROJECT INTERVIEWS
// =====================================================
//
// GET
// /api/data/projects/:projectId/interviews
//
// Requires:
//
// canViewInterviews
//
// =====================================================

router.get(
  "/projects/:projectId/interviews",

  requireAuth,

  requireProjectPermission(
    "canViewInterviews"
  ),

  getProjectInterviews
);


// =====================================================
// GET PROJECT RECORDINGS
// =====================================================
//
// GET
// /api/data/projects/:projectId/recordings
//
// Requires:
//
// canViewRecordings
//
// =====================================================

router.get(
  "/projects/:projectId/recordings",

  requireAuth,

  requireProjectPermission(
    "canViewRecordings"
  ),

  getProjectRecordings
);


// =====================================================
// GET PROJECT EVALUATIONS
// =====================================================
//
// GET
// /api/data/projects/:projectId/evaluations
//
// V1:
//
// Evaluations should be protected by the general
// project data permission.
//
// Later we can add:
//
// canViewEvaluations
//
// to ProjectMembership once evaluation permissions
// become independently configurable.
//
// =====================================================

router.get(
  "/projects/:projectId/evaluations",

  requireAuth,

  requireProjectPermission(
    "canManageData"
  ),

  getProjectEvaluations
);

router.get(
  "/projects/:projectId/transcriptions",

  requireAuth,

  requireProjectPermission(
    "canViewTranscriptions"
  ),

  getProjectTranscriptions
);


// =====================================================
// EXPORT
// =====================================================

export default router;
