// src/configs/confosRegistry.js

// =====================================================
// CONFOS
// =====================================================

import oneToOne
  from "./1-to-1.json";

import oneToMany
  from "./1-to-many.json";

import hostToMany
  from "./host-to-many.json";

import remoteTraining
  from "./remote-training.json";

import aiVideoInterviewer
  from "./ai-video-interviewer.json";

import filePreview
  from "./file-preview.json";

import mediaFeed
  from "./media-feed.json";

import remoteVideoGrid
  from "./remote-video-grid.json";

import groupCall
  from "./group_call.json";


// =====================================================
// CONFO REGISTRY
// =====================================================

const ConfosRegistry = {

  // ===================================================
  // VIDEO CALLS
  // ===================================================

  "confo.one_to_one":
    oneToOne,

  "confo.one_to_many":
    oneToMany,

  "confo.host_to_many":
    hostToMany,

  "confo.group_call":
    groupCall,


  // ===================================================
  // TRAINING
  // ===================================================

  "confo.remote_training":
    remoteTraining,


  // ===================================================
  // AI
  // ===================================================

  "confo.ai_video_interviewer":
    aiVideoInterviewer,


  // ===================================================
  // MEDIA TEST CONFOS
  // ===================================================

  "confo.pdf_preview":
    filePreview,

  "confo.media_test":
    mediaFeed,

  "confo.remote_video_grid":
    remoteVideoGrid,

};


// =====================================================
// DEBUG
// =====================================================

console.log(
  "[CONFOS REGISTRY LOADED]",
  {
    confos:
      Object.keys(
        ConfosRegistry
      ),
  }
);


// =====================================================
// EXPORT
// =====================================================

export default ConfosRegistry;