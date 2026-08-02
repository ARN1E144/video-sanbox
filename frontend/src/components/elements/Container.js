import React from "react";

export default function Container({
 children,
 style
}){

return (

<div
style={{
 width:"100%",
 flex:1,
 display:"flex",
 flexDirection:"column",
 alignItems:"center",
 justifyContent:"center",
 backgroundColor:style?.backgroundColor || "#181818",
 overflow:"hidden"
}}
>

{children}

</div>

);

}