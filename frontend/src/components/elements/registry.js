import VideoFeed from "./VideoFeed.js";
import AgoraFeed from "./AgoraFeed.js";
import ChatPanel from "./ChatPanel";
import TextBox from "./TextBox.js";
import MicButton from "./MicButton.js";
import ControlButton from "./ControlButton.js";
import AppBar from "./AppBar.js";
import Container from "./Container.js";
import Text from "./Text.js";
import ControlPanel from "./ControlPanel.js";
import FetchCallsDebug from "./FetchCallsDebug.js";
import ParticipantSelector from "./ParticipantSelector.js";




const registry = {

VideoFeed:{
 component:VideoFeed
},

AgoraFeed:{
 component:AgoraFeed
},

ChatPanel:{
 component:ChatPanel
},

TextBox:{
 component:TextBox
},

MicButton:{
 component:MicButton
},

ControlPanel:{
 component:ControlPanel
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
},

FetchCallsDebug:{
 component:FetchCallsDebug
},
ParticipantSelector:{
 component:ParticipantSelector
},

};

export default registry;
