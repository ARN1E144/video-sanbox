import React from "react";


export default function ScrollPanel({
  children,
  height = 260,
}) {


  return (

    <div
      style={{

        maxHeight:height,

        overflowY:"auto",

        border:"1px solid #333",

        borderRadius:8,

        padding:8,

        background:"#111",

      }}
    >

      {children}

    </div>

  );

}