export default function AppBar({ 
  label,
  title,
  style 
}) {
  return (
    <div
      style={{
        height: 56,
        width:"100%",
        display:"flex",
        alignItems:"center",
        padding:"0 16px",
        backgroundColor: style?.backgroundColor || "#000",
        color: style?.color || "#fff",
        fontWeight:600,
        fontSize: style?.fontSize || 18,
      }}
    >
      {label || title || "App Header"}
    </div>
  );
}