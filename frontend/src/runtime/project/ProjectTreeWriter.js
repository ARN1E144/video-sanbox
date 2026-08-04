/**
 * ============================================================
 * ProjectTreeWriter
 * ============================================================
 *
 * Converts Canvas elements back into a project tree.
 *
 * Phase 1:
 * --------
 * Flat tree only.
 *
 * Future:
 * --------
 * Parent / child hierarchy
 * Layout containers
 * Auto-layout
 *
 */

function elementToNode(element, index) {

  if(!element){
    return null;
  }


  return {

    id:
      element.id ||
      `${element.type}_${index}`,

    type:
      element.type,

    x:
      element.x,

    y:
      element.y,

    width:
      element.width,

    height:
      element.height,

    props:{
      ...(element.props || {})
    }

  };

}

export function elementsToProjectTree(elements = []) {
  return {
    type: "App",

    props: {},

    children:
    elements
     .map((el,index)=>elementToNode(el,index))
    };
}

export default {
  elementsToProjectTree,
};