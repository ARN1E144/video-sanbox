import React from "react";

export default function Container({
 children,
 style = {},
}) {

return (

<div

style={{

width:"100%",
height:"100%",

display:"flex",

flexDirection:"column",

alignItems:"center",

justifyContent:"center",

backgroundColor:
style.backgroundColor || "rgba(255,255,255,0.05)",

borderRadius:
style.borderRadius || "0px",

border:
"1px dashed rgba(255,255,255,0.2)",

position:"relative",

overflow:"hidden"

}}

>

{children}

</div>

);

}