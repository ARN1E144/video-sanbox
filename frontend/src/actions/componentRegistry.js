// src/components/elements/componentRegistry.js


// =====================================================
// COMPONENTS
// =====================================================

import VideoFeed
  from "../components/elements/VideoFeed";

import AgoraFeed
  from "../components/elements/AgoraFeed";

import ChatPanel
  from "../components/elements/ChatPanel";

import TextBox
  from "../components/elements/TextBox";

import MicButton
  from "../components/elements/MicButton";

import ControlButton
  from "../components/elements/ControlButton";

import AppBar
  from "../components/elements/AppBar";

import Container
  from "../components/elements/Container";

import Text
  from "../components/elements/Text";

import ControlPanel
  from "../components/elements/ControlPanel";

import TextLabel
  from "../components/elements/TextLabel.js";

import FetchCallsDebug
  from "../components/elements/FetchCallsDebug.js";

import AvailabilityButton
  from "../components/elements/AvailabilityButton.js";

import InterviewPanel
  from "../components/elements/InterviewPanel";

import ParticipantSelector
  from "../components/elements/ParticipantSelector";

import TrainingInvitation
  from "../components/elements/TrainingInvitation";

import MediaFeed
  from "../components/elements/MediaFeed.js";

import RemoteVideoGrid
  from "../components/elements/RemoteVideoGrid.js";

import FilePreview
  from "../components/elements/FilePreview.js";

import FileUpload
  from "../components/elements/FileUpload";

import Select 
  from "../components/elements/Select";



// =====================================================
// COMPLIANCE
// =====================================================

import ComplianceEvidence
  from "../components/elements/ComplianceEvidence.js";


// =====================================================
// CONTRACTS
// =====================================================

import videoContract
  from "../runtime/contracts/components/VideoFeed.contract.js";

import agoraContract
  from "../runtime/contracts/components/AgoraFeed.contract.js";

import chatContract
  from "../runtime/contracts/components/ChatPanel.contract.js";

import textBoxContract
  from "../runtime/contracts/components/TextBox.contract.js";

import micContract
  from "../runtime/contracts/components/MicButton.contract.js";

import controlButtonContract
  from "../runtime/contracts/components/ControlButton.contract.js";

import appBarContract
  from "../runtime/contracts/components/AppBar.contract.js";

import containerContract
  from "../runtime/contracts/components/Container.contract.js";

import textContract
  from "../runtime/contracts/components/Text.contract.js";

import controlPanelContract
  from "../runtime/contracts/components/ControlPanel.contract.js";

import textLabelContract
  from "../runtime/contracts/components/TextLabel.contract.js";

import fetchCallsDebugContract
  from "../runtime/contracts/components/FetchCallsDebug.contract.js";

import availabilityButtonContract
  from "../runtime/contracts/components/AvailabilityButton.contract.js";

import interviewPanelContract
  from "../runtime/contracts/components/InterviewPanel.contract.js";

import participantSelectorContract
  from "../runtime/contracts/components/ParticipantSelector.contract.js";

import trainingInvitationContract
  from "../runtime/contracts/components/TrainingInvitation.contract.js";

import mediaFeedContract
  from "../runtime/contracts/components/MediaFeed.contract.js";

import remoteVideoGridContract
  from "../runtime/contracts/components/RemoteVideoGrid.contract.js";

import filePreviewContract
  from "../runtime/contracts/components/FilePreview.contract.js";

import fileUploadContract
  from "../runtime/contracts/components/FileUpload.contract.js";

import selectContract 
  from "../runtime/contracts/components/Select.contract.js";


// =====================================================
// COMPLIANCE CONTRACTS
// =====================================================

import complianceEvidenceContract
  from "../runtime/contracts/components/ComplianceEvidence.contract.js";


// =====================================================
// COMPONENT REGISTRY
// =====================================================

export const componentRegistry = {


  // ===================================================
  // MEDIA
  // ===================================================

  VideoFeed: {

    component:
      VideoFeed,

    contract:
      videoContract,

  },


  AgoraFeed: {

    component:
      AgoraFeed,

    contract:
      agoraContract,

  },


  MediaFeed: {

    component:
      MediaFeed,

    contract:
      mediaFeedContract,

  },


  RemoteVideoGrid: {

    component:
      RemoteVideoGrid,

    contract:
      remoteVideoGridContract,

  },


  FilePreview: {

    component:
      FilePreview,

    contract:
      filePreviewContract,

  },

  FileUpload: {

  component:
    FileUpload,

  contract:
    fileUploadContract,

  },

  Select: {

    component: 
      Select,

    contract: 
      selectContract
  },


  // ===================================================
  // COMMUNICATION
  // ===================================================

  ChatPanel: {

    component:
      ChatPanel,

    contract:
      chatContract,

  },


  ParticipantSelector: {

    component:
      ParticipantSelector,

    contract:
      participantSelectorContract,

  },


  TrainingInvitation: {

    component:
      TrainingInvitation,

    contract:
      trainingInvitationContract,

  },


  // ===================================================
  // AI
  // ===================================================

  InterviewPanel: {

    component:
      InterviewPanel,

    contract:
      interviewPanelContract,

  },


  // ===================================================
  // CONTROLS
  // ===================================================

  MicButton: {

    component:
      MicButton,

    contract:
      micContract,

  },


  ControlButton: {

    component:
      ControlButton,

    contract:
      controlButtonContract,

  },


  ControlPanel: {

    component:
      ControlPanel,

    contract:
      controlPanelContract,

  },


  AvailabilityButton: {

    component:
      AvailabilityButton,

    contract:
      availabilityButtonContract,

  },


  // ===================================================
  // LAYOUT
  // ===================================================

  AppBar: {

    component:
      AppBar,

    contract:
      appBarContract,

  },


  Container: {

    component:
      Container,

    contract:
      containerContract,

  },


  // ===================================================
  // TEXT
  // ===================================================

  Text: {

    component:
      Text,

    contract:
      textContract,

  },


  TextBox: {

    component:
      TextBox,

    contract:
      textBoxContract,

  },


  TextLabel: {

    component:
      TextLabel,

    contract:
      textLabelContract,

  },


  // ===================================================
  // COMPLIANCE
  // ===================================================

  ComplianceEvidence: {

    component:
      ComplianceEvidence,

    contract:
      complianceEvidenceContract,

  },


  // ===================================================
  // DEBUG
  // ===================================================

  FetchCallsDebug: {

    component:
      FetchCallsDebug,

    contract:
      fetchCallsDebugContract,

  },

};


// =====================================================
// DEBUG
// =====================================================

console.log(
  "[COMPONENT REGISTRY LOADED]",
  {

    components:
      Object.keys(
        componentRegistry
      ),

  }
);


console.log(
  "[MEDIA COMPONENT REGISTRY]",
  {

    VideoFeed:
      !!componentRegistry.VideoFeed,

    AgoraFeed:
      !!componentRegistry.AgoraFeed,

    MediaFeed:
      !!componentRegistry.MediaFeed,

    RemoteVideoGrid:
      !!componentRegistry.RemoteVideoGrid,

    FilePreview:
      !!componentRegistry.FilePreview,

  }
);


console.log(
  "[COMPLIANCE COMPONENT REGISTRY]",
  {

    ComplianceEvidence:
      !!componentRegistry.ComplianceEvidence,

  }
);


// =====================================================
// EXPORT
// =====================================================

export default componentRegistry;