import oneToOne
  from "./1-to-1.json";

import oneToMany
  from "./1-to-many.json";

import hostToMany
  from "./host-to-many.json";

import remoteTraining
  from "./remote-training.json";


const ConfosRegistry = {

  "confo.one_to_one":
    oneToOne,

  "confo.one_to_many":
    oneToMany,

  "confo.host_to_many":
    hostToMany,

  "confo.remote_training":
    remoteTraining

};


export default ConfosRegistry;