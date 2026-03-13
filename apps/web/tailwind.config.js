/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "wood-dark": "#3E2723",
        "wood-medium": "#5D4037",
        "harvest-gold": "#FFD54F",
        "harvest-green": "#4CAF50",
        "parchment": "#FFF8E1",
        "dry-soil": "#8D6E63",
      },
    },
  },
  plugins: [],
};
