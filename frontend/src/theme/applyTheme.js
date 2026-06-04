export function applyTheme(theme) {
  const root = document.documentElement;

  if (!theme?.colors) return;

  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
}