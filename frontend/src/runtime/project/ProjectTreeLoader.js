// src/runtime/project/ProjectTreeLoader.js


/**
 * ProjectTreeLoader
 *
 * Converts projectSchema.tree
 * into CanvasContext.elements format.
 *
 * Flow:
 *
 * projectSchema.tree
 *        |
 *        ↓
 * projectTreeToElements()
 *        |
 *        ↓
 * Canvas elements[]
 *
 */


const DEFAULT_ELEMENT_SIZE = {

  Container:{
    width:1000,
    height:700,
  },

  AgoraFeed:{
    width:800,
    height:450,
  },

  ControlPanel:{
    width:250,
    height:80,
  },

  Text:{
    width:250,
    height:50,
  },

  default:{
    width:300,
    height:150,
  }

};



function createDefaultPosition(index = 0) {

  return {
    x: 50,
    y: 50 + (index * 150),
  };

}



/**
 * Convert a single tree node
 *
 * Input:
 *
 * {
 *   type:"AgoraFeed",
 *   id:"agora_host"
 * }
 *
 *
 * Output:
 *
 * {
 *   id:"agora_host",
 *   type:"AgoraFeed",
 *   x:50,
 *   y:50,
 *   width:800,
 *   height:500,
 *   props:{}
 * }
 *
 */


function convertNode(node, index = 0) {


  if (!node || typeof node !== "object") {
    return null;
  }


  const position = createDefaultPosition(index);
  

  const size =
  DEFAULT_ELEMENT_SIZE[node.type]
  ||
  DEFAULT_ELEMENT_SIZE.default;



  return {


    // Canvas identity
    id:
    node.id ||
    `${node.type || "element"}_${index}`,



    // Registry component type
    type:
      node.type ||
      "Text",



    // Canvas positioning
    x:
      node.x ??
      position.x,


    y:
      node.y ??
      position.y,



    width:
    node.width ??
    size.width,


    height:
    node.height ??
    size.height,



    // Runtime bindings / component props
    props:
      {
        ...(node.props || {})
      },


    // Optional metadata
    meta:
      {
        source:"project-tree"
      }

  };


}



/**
 * Handles tree children
 *
 * Future compatible with:
 *
 * {
 *   type:"Container",
 *   children:[
 *      {...},
 *      {...}
 *   ]
 * }
 *
 */


function flattenTree(node, result = []) {

  if (!node) {
    return result;
  }


  if (Array.isArray(node)) {

    node.forEach(child =>
      flattenTree(child, result)
    );

    return result;
  }


  /*
    App is the project root.
    It is not a canvas element.
  */

  if (node.type !== "App") {

    const element =
      convertNode(
        node,
        result.length
      );


    if(element){
      result.push(element);
    }

  }



  if(Array.isArray(node.children)) {

    node.children.forEach(child => {

      flattenTree(
        child,
        result
      );

    });

  }


  return result;

}





/**
 * Public API
 *
 * Converts:
 *
 * projectSchema.tree
 *
 * into:
 *
 * Canvas elements[]
 *
 */


export function projectTreeToElements(tree) {


  if(!tree){
    return [];
  }


  return flattenTree(tree);

}




export default {
  projectTreeToElements
};