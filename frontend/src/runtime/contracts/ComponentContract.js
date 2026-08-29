import agoraFeed
  from "./components/AgoraFeed.contract.js";

import videoFeed
  from "./components/VideoFeed.contract.js";

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


// =====================================================
// COMPONENT CONTRACT REGISTRY
// =====================================================

const ComponentContract = {

  AgoraFeed:
    agoraFeed,

  VideoFeed:
    videoFeed,

  ControlButton:
    controlButton,

  ControlPanel:
    controlPanel,

  ChatPanel:
    chatPanel,

  MicButton:
    micButton,

  Container:
    container,

  TextBox:
    textBox,

  AppBar:
    appBar,

  Text:
    text,

  TextLabel:
    textLabel,

  InterviewPanel:
    interviewPanel,

  ParticipantSelector:
    participantSelector,

  TrainingInvitation:
    trainingInvitation,

};


export default ComponentContract;