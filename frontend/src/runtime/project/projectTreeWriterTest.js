import {
  elementsToProjectTree,
} from "./ProjectTreeWriter.js";

const elements = [
  {
    id: "host",
    type: "AgoraFeed",

    x: 100,
    y: 50,

    width: 640,
    height: 360,

    props: {
      channel: "{{call.channel}}",
    },
  },
];

console.log(
  JSON.stringify(
    elementsToProjectTree(elements),
    null,
    2
  )
);