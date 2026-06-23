/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#1E2A6E",   // deep navy
          light: "#2C3A8E",
          50: "#EEF0F8",
        },
        accent: {
          DEFAULT: "#D4A017",   // warm gold
          light: "#E8CC80",
          50: "#FDF8E8",
        },
        crimson: {
          DEFAULT: "#B43C28",   // warm crimson
          light: "#E8A090",
          50: "#FDF3F1",
        },
        ivory: {
          DEFAULT: "#FAF7F2",   // warm ivory
          dark: "#F0EAE0",
        },
      },
    },
  },
  plugins: [],
};