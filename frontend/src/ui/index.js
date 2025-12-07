// src/ui/index.js
// Registry linking template node types to real React components
// from src/components/elements/

import App from '../components/elements/AppContainer';
import AppBar from '../components/elements/AppBar';
import Container from '../components/elements/Container';
import VideoFeed from '../components/elements/VideoFeed';
import ChatPanel from '../components/elements/ChatPanel';
import MicButton from '../components/elements/MicButton';
import TextBox from '../components/elements/TextBox';
import ControlButton from '../components/elements/ControlButton';

// Named exports
export {
  App,
  AppBar,
  Container,
  VideoFeed,
  ChatPanel,
  MicButton,
  TextBox,
  ControlButton,
};

// Default export as registry
const UI = {
  App,
  AppBar,
  Container,
  VideoFeed,
  ChatPanel,
  MicButton,
  TextBox,
  ControlButton,
};

export default UI;
