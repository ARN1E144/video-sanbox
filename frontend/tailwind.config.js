/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#1C1C1E',
        panel: '#2C2C2E',
        border: '#3A3A3C',
        accent: {
          DEFAULT: '#9B6BFF',
          light: '#B28DFF',
        },
        text: {
          primary: '#FFFFFF',
          muted: '#A1A1A5',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'lg-2xl': '1rem',
      },
    },
  },
  plugins: [],
};
