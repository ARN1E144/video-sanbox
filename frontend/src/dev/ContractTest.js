import React from "react";

import ComponentContractManager
from "../runtime/contracts/ComponentContractManager";


export default function ContractTest(){


  const agora =
    ComponentContractManager.getContract(
      "AgoraFeed"
    );


  const video =
    ComponentContractManager.getContract(
      "VideoFeed"
    );


  const agoraActions =
    ComponentContractManager.getActions(
      "AgoraFeed"
    );


  const agoraTargets =
    ComponentContractManager.getTargets(
      "AgoraFeed"
    );


  const agoraCapabilities =
    ComponentContractManager.getCapabilities(
      "AgoraFeed"
    );



  console.log(
    "[CONTRACT TEST] AgoraFeed FULL",
    agora
  );


  console.log(
    "[CONTRACT TEST] AgoraFeed ACTIONS",
    agoraActions
  );


  console.log(
    "[CONTRACT TEST] AgoraFeed TARGETS",
    agoraTargets
  );


  console.log(
    "[CONTRACT TEST] AgoraFeed CAPABILITIES",
    agoraCapabilities
  );


  console.log(
    "[CONTRACT TEST] VideoFeed FULL",
    video
  );



  return (

    <div
      style={{
        padding:20,
        color:"white"
      }}
    >
      Contract test running. Check console.

    </div>

  );

}