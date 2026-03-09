// src/components/elements/registry.js
import VideoFeed from './VideoFeed';
import AgoraFeed from './AgoraFeed';
import ChatPanel from './ChatPanel';
import TextBox from './TextBox';
import MicButton from './MicButton';
import ControlButton from './ControlButton';
import AppBar from './AppBar';
import Container from './Container';
import Text from './Text';
import withActions from './withActions';

/**
 * Wrap all components with withActions HOC
 * so they automatically receive `emitAction`
 */
const registry = {
  VideoFeed: withActions(VideoFeed),
  AgoraFeed: withActions(AgoraFeed),
  ChatPanel: withActions(ChatPanel),
  TextBox: withActions(TextBox),
  MicButton: withActions(MicButton),
  ControlButton: withActions(ControlButton),
  AppBar: withActions(AppBar),
  Container: withActions(Container),
  Text: withActions(Text),
};

export default registry;

