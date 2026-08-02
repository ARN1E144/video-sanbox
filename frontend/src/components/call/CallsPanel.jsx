import React, {
  useState
} from "react";

import {
  useRuntimeValue
} from "../../hooks/useRuntimeValue";

import CallCard from "./CallCard";


export default function CallsPanel(){

  const [open,setOpen] = useState(false);


  const availableCalls =
    useRuntimeValue(
      "calls.available"
    );


  const calls =
    availableCalls || [];



  return (

    <div

      style={{

        marginTop:12,

        border:"1px solid #333",

        borderRadius:8,

        overflow:"hidden"

      }}

    >


      {/* HEADER */}

      <button

        onClick={()=>setOpen(!open)}

        style={{

          width:"100%",

          padding:10,

          background:"#252525",

          color:"#fff",

          border:"none",

          cursor:"pointer",

          display:"flex",

          justifyContent:"space-between",

          fontFamily:"monospace"

        }}

      >

        <span>
          Available Calls
        </span>


        <span>

          {calls.length}

          {" "}

          {open ? "▲" : "▼"}

        </span>


      </button>




      {/* CONTENT */}

      {
        open && (

          <div

            style={{

              maxHeight:300,

              overflowY:"auto",

              padding:8,

              display:"grid",

              gap:8,

              background:"#111"

            }}

          >

            {
              calls.length === 0

              ?

              <div>
                No available calls
              </div>

              :

              calls.map(call=>(

                <CallCard

                  key={
                    call._id
                  }

                  call={call}

                />

              ))

            }


          </div>

        )

      }


    </div>

  );

}