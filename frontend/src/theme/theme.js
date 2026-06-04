
export function applyTheme(theme) {
  const root = document.documentElement;

  // colors
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-light", theme.colors.accentLight);

  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--surface", theme.colors.surface);
  root.style.setProperty("--panel", theme.colors.surface); // optional mapping
  root.style.setProperty("--border", theme.colors.border);

  root.style.setProperty("--text-primary", theme.colors.textPrimary);
  root.style.setProperty("--text-muted", theme.colors.textSecondary);

  root.style.setProperty("--danger", theme.colors.danger);

  // spacing
  root.style.setProperty("--space-sm", theme.spacing.sm);
  root.style.setProperty("--space-md", theme.spacing.md);
  root.style.setProperty("--space-lg", theme.spacing.lg);

  // radius
  root.style.setProperty("--radius-sm", theme.radius.sm);
  root.style.setProperty("--radius-md", theme.radius.md);
  root.style.setProperty("--radius-lg", theme.radius.lg);

  // typography (optional but useful later)
  root.style.setProperty("--font-family", theme.typography.fontFamily);
  root.style.setProperty("--font-base", theme.typography.baseSize);
  root.style.setProperty("--font-heading-weight", theme.typography.headingWeight);
  root.style.setProperty("--font-body-weight", theme.typography.bodyWeight);
}


export const theme = {
    colors: {
    accent: "#7C3AED",
    accentLight: "#A78BFA",
    background: "#0E0E10",
    surface: "#1A1A1D",
    border: "#2A2A2E",
    textPrimary: "#FFFFFF",
    textSecondary: "#B3B3B3",
    danger: "#EF4444",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    baseSize: "14px",
    headingWeight: 600,
    bodyWeight: 400,
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
};