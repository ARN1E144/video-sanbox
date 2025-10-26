export function showElementStatus(id, status) {
  // Remove existing badge if it exists
  const existing = document.querySelector(`.status-badge-${id}`);
  if (existing) existing.remove();

  // Find the element wrapper on canvas
  const el = document.getElementById(`canvas-element-${id}`);
  if (!el) return;

  const badge = document.createElement("div");
  badge.className = `status-badge-${id}`;
  badge.style.position = "absolute";
  badge.style.top = "-12px";
  badge.style.right = "-12px";
  badge.style.padding = "4px 6px";
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "600";
  badge.style.borderRadius = "6px";
  badge.style.color = "white";
  badge.style.zIndex = "9999";
  badge.style.pointerEvents = "none";
  badge.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
  badge.style.transition = "opacity 0.3s ease";

  if (status === "success") {
    badge.textContent = "✅ Success";
    badge.style.backgroundColor = "#16a34a";
  } else if (status === "error") {
    badge.textContent = "❌ Error";
    badge.style.backgroundColor = "#dc2626";
  } else if (status === "pending") {
    badge.textContent = "⏳ Loading";
    badge.style.backgroundColor = "#eab308";
    badge.style.color = "#000";
  }

  el.style.position = "relative"; // ensure positioning works
  el.appendChild(badge);

  setTimeout(() => {
    badge.style.opacity = "0";
    setTimeout(() => badge.remove(), 400);
  }, 3000);
}
