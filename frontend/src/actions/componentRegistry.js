import VideoFeed from "../components/elements/VideoFeed";
import AgoraFeed from "../components/elements/AgoraFeed";
import ChatPanel from "../components/elements/ChatPanel";
import TextBox from "../components/elements/TextBox";
import MicButton from "../components/elements/MicButton";
import ControlButton from "../components/elements/ControlButton";
import AppBar from "../components/elements/AppBar";
import Container from "../components/elements/Container";
import Text from "../components/elements/Text";
import ControlPanel from "../components/elements/ControlPanel";
import TextLabel from "../components/elements/TextLabel.js";
import FetchCallsDebug from "../components/elements/FetchCallsDebug.js";
import AvailabilityButton from "../components/elements/AvailabilityButton.js";
import InterviewPanel from "../components/elements/InterviewPanel";


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

import fetchCallsDebug
  from "../runtime/contracts/components/FetchCallsDebug.contract.js";

import availabilityButtonContract
  from "../runtime/contracts/components/AvailabilityButton.contract.js";

import interviewPanelContract 
  from "../runtime/contracts/components/InterviewPanel.contract.js";

export const componentRegistry = {

  VideoFeed: {
    component: VideoFeed,
    contract: videoContract
  },

  AgoraFeed: {
    component: AgoraFeed,
    contract: agoraContract
  },

  ChatPanel: {
    component: ChatPanel,
    contract: chatContract
  },

  InterviewPanel: {
    component: InterviewPanel,
    contract: interviewPanelContract,
  },

  TextBox: {
    component: TextBox,
    contract: textBoxContract
  },

  MicButton: {
    component: MicButton,
    contract: micContract
  },

  ControlButton: {
    component: ControlButton,
    contract: controlButtonContract
  },

  ControlPanel: {
    component: ControlPanel,
    contract: controlPanelContract
  },

  AppBar: {
    component: AppBar,
    contract: appBarContract
  },

  Container: {
    component: Container,
    contract: containerContract
  },

  Text: {
    component: Text,
    contract: textContract
  },

  TextLabel: {
    component: TextLabel,
    contract: textLabelContract
  },

  FetchCallsDebug: {
  component: FetchCallsDebug,
  contract: fetchCallsDebug,
},

AvailabilityButton: {
  component: AvailabilityButton,
  contract: availabilityButtonContract,
},

};


export default componentRegistry;