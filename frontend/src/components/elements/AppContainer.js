export default function AppContainer({children, style}) {

return (

<div
style={{
 width:"100%",
 minHeight:"500px",
 display:"flex",
 flexDirection:"column",
 backgroundColor: style?.backgroundColor || "#121212",
 color:"#fff",
 overflow:"hidden",
}}
>

{children}

</div>

);

}