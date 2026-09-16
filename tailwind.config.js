/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#121212",          // Dark Background
          card: "#18181B",        // Card / Container fill
          yellow: "#FACC15",      // Zepqwik Yellow
          yellowDark: "#EAB308",  // Pressed state yellow
          green: "#22C55E",       // Zepqwik Green accent
          border: "#27272A",      // Input border
        },
      },
    },
  },
  plugins: [],
};