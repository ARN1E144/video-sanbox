import { projectTreeToElements } from "./ProjectTreeLoader.js";

const tree = {
  id: "root",
  type: "Container",
  children: [
    {
      id: "host",
      type: "AgoraFeed"
    },
    {
      id: "controls",
      type: "ControlPanel"
    }
  ]
};

console.log(projectTreeToElements(tree));