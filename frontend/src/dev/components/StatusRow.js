import React from "react";


export default function StatusRow({
  label,
  value,
}) {


  const renderValue = () => {


    if(value === null || value === undefined){

      return (
        <span style={{color:"#888"}}>
          null
        </span>
      );

    }



    if(typeof value === "boolean"){

      return (

        <span
          style={{
            color:
              value
              ? "#00d26a"
              : "#ff6b6b",
            fontWeight:"bold",
          }}
        >
          {value ? "TRUE" : "FALSE"}
        </span>

      );

    }



    if(Array.isArray(value)){

      return (

        <span>

          [
          {value.length}
          ]

        </span>

      );

    }



    if(typeof value === "object"){

      return (

        <span>
          {JSON.stringify(value)}
        </span>

      );

    }



    return String(value);


  };



  return (

    <div
      style={{
        display:"flex",
        justifyContent:"space-between",
        marginBottom:6,
        fontSize:13,
      }}
    >

      <span
        style={{
          color:"#aaa"
        }}
      >
        {label}
      </span>


      <strong>
        {renderValue()}
      </strong>


    </div>

  );

}