// =====================================================
// COMPONENT CONTRACTS
// =====================================================

import agoraFeed
  from "./components/AgoraFeed.contract.js";

import videoFeed
  from "./components/VideoFeed.contract.js";

import mediaFeed
  from "./components/MediaFeed.contract.js";

import remoteVideoGrid
  from "./components/RemoteVideoGrid.contract.js";

import filePreview
  from "./components/FilePreview.contract.js";

import controlButton
  from "./components/ControlButton.contract.js";

import controlPanel
  from "./components/ControlPanel.contract.js";

import chatPanel
  from "./components/ChatPanel.contract.js";

import micButton
  from "./components/MicButton.contract.js";

import container
  from "./components/Container.contract.js";

import textBox
  from "./components/TextBox.contract.js";

import appBar
  from "./components/AppBar.contract.js";

import text
  from "./components/Text.contract.js";

import textLabel
  from "./components/TextLabel.contract.js";

import interviewPanel
  from "./components/InterviewPanel.contract.js";

import participantSelector
  from "./components/ParticipantSelector.contract.js";

import trainingInvitation
  from "./components/TrainingInvitation.contract.js";

import incomingGroupCallAlert
  from "./components/IncomingGroupCallAlert.contract.js";


// =====================================================
// COMPONENT CONTRACT REGISTRY
// =====================================================

const ComponentContract = {

  // ===================================================
  // MEDIA
  // ===================================================

  AgoraFeed:
    agoraFeed,

  VideoFeed:
    videoFeed,

  MediaFeed:
    mediaFeed,

  RemoteVideoGrid:
    remoteVideoGrid,

  FilePreview:
    filePreview,


  // ===================================================
  // CONTROLS
  // ===================================================

  ControlButton:
    controlButton,

  ControlPanel:
    controlPanel,

  MicButton:
    micButton,


  // ===================================================
  // COMMUNICATION
  // ===================================================

  ChatPanel:
    chatPanel,

  ParticipantSelector:
    participantSelector,

  TrainingInvitation:
    trainingInvitation,

  IncomingGroupCallAlert:
    incomingGroupCallAlert,


  // ===================================================
  // LAYOUT
  // ===================================================

  Container:
    container,

  AppBar:
    appBar,


  // ===================================================
  // TEXT
  // ===================================================

  TextBox:
    textBox,

  Text:
    text,

  TextLabel:
    textLabel,


  // ===================================================
  // AI
  // ===================================================

  InterviewPanel:
    interviewPanel,

};


export default ComponentContract;