import Validator from "./ContractValidator.js";


console.log(
"\nTEST 1 ControlButton -> AgoraFeed startCall"
);

console.log(

Validator.validateConnection({

sourceType:"ControlButton",

action:"call.startCall",

targetType:"AgoraFeed"

})

);



console.log(
"\nTEST 2 ControlButton -> AgoraFeed toggleMic"
);


console.log(

Validator.validateConnection({

sourceType:"ControlButton",

action:"call.toggleMic",

targetType:"AgoraFeed"

})

);



console.log(
"\nTEST 3 Invalid ControlButton -> VideoFeed toggleMic"
);


console.log(

Validator.validateConnection({

sourceType:"ControlButton",

action:"call.toggleMic",

targetType:"VideoFeed"

})

);



console.log(
"\nTEST 4 Invalid AgoraFeed -> ControlButton"
);


console.log(

Validator.validateConnection({

sourceType:"AgoraFeed",

action:"call.toggleMic",

targetType:"ControlButton"

})

);