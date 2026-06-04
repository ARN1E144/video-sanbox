import VideoFeed from "./VideoFeed";
import AgoraFeed from "./AgoraFeed";
import ChatPanel from "./ChatPanel";
import TextBox from "./TextBox";
import MicButton from "./MicButton";
import ControlButton from "./ControlButton";
import AppBar from "./AppBar";
import Container from "./Container";
import Text from "./Text";
import ControlPanel from "./ControlPanel";


// META
import videoMeta from "./VideoFeed.meta.json";
import agoraMeta from "./AgoraFeed.meta.json";
import chatMeta from "./ChatPanel.meta.json";
import textBoxMeta from "./TextBox.meta.json";
import micMeta from "./MicButton.meta.json";
import controlPanelMeta from "./ControlPanel.meta.json";




const registry = {
  VideoFeed: {
    component: VideoFeed,
    meta: videoMeta,
  },

  AgoraFeed: {
    component: AgoraFeed,
    meta: agoraMeta,
  },

  ChatPanel: {
    component: ChatPanel,
    meta: chatMeta,
  },

  TextBox: {
    component: TextBox,
    meta: textBoxMeta,
  },

  MicButton: {
    component: MicButton,
    meta: micMeta,
  },

  ControlPanel: {
    component: ControlPanel,
    meta: controlPanelMeta,
  },

  ControlButton: {
    component: ControlButton,
  },

  AppBar: {
    component: AppBar,
  },

  Container: {
    component: Container,
  },

  Text: {
    component: Text,
  },
};


export default registry;