import ConfoLoader from "./ConfoLoader.js";
import testConfo from "./tests/valid-runtime.confo.js";


const loader =
new ConfoLoader();


const result =
loader.load(testConfo);



console.log(result);