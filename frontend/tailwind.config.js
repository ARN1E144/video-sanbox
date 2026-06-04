// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "accent-light": "var(--accent-light)",

        background: "var(--background)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        border: "var(--border)",

        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",

        danger: "var(--danger)",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },

      spacing: {
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
      },
    },
  },
  plugins: [],
};