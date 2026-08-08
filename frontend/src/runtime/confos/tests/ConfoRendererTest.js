import ConfoLoader from "../ConfoLoader.js";
import testConfo from "./valid-runtime.confo.js";


const loader =
new ConfoLoader();


const result =
loader.load(testConfo);


console.log(
  "LOADED TREE"
);


function printTree(node, depth=0){

  console.log(
    " ".repeat(depth),
    node.type,
    node.id
  );


  if(node.children){

    node.children.forEach(
      child =>
        printTree(
          child,
          depth + 2
        )
    );

  }

}


printTree(
  result.confo.tree
);