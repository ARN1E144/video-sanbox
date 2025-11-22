import { runAction } from '../utils/actionExecutor';


const actionsRegistry = {
StartStream: (ctx, params) => runAction('StartStream', ctx, params),
StopStream: (ctx, params) => runAction('StopStream', ctx, params),
LoadVideo: (ctx, params) => runAction('LoadVideo', ctx, params),
SendMessage: (ctx, params) => runAction('SendMessage', ctx, params),
ReceiveMessage: (ctx, params) => runAction('ReceiveMessage', ctx, params),
ToggleMic: (ctx, params) => runAction('ToggleMic', ctx, params),
EndCall: (ctx, params) => runAction('EndCall', ctx, params),
};


export default actionsRegistry;