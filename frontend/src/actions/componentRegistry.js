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


// META

import videoMeta from "../components/elements/VideoFeed.meta.json";
import agoraMeta from "../components/elements/AgoraFeed.meta.json";
import chatMeta from "../components/elements/ChatPanel.meta.json";
import textBoxMeta from "../components/elements/TextBox.meta.json";
import micMeta from "../components/elements/MicButton.meta.json";
import controlPanelMeta from "../components/elements/ControlPanel.meta.json"; 



export const componentRegistry = {

  VideoFeed:{
    component:VideoFeed,
    meta:videoMeta
  },


  AgoraFeed:{
    component:AgoraFeed,
    meta:agoraMeta
  },


  ChatPanel:{
    component:ChatPanel,
    meta:chatMeta
  },


  TextBox:{
    component:TextBox,
    meta:textBoxMeta
  },


  MicButton:{
    component:MicButton,
    meta:micMeta
  },


  ControlPanel:{
    component:ControlPanel,
    meta:controlPanelMeta
  },


  ControlButton:{
    component:ControlButton
  },


  AppBar:{
    component:AppBar
  },


  Container:{
    component:Container
  },


  Text:{
    component:Text
  }

};


export default componentRegistry;