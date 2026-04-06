/** @type {import('tailwindcss').Config} */
const ECFDF5CC = "#ECFDF5CC";
const BUTTON_GRADIENT_START = "#206223";
const BUTTON_GRADIENT_END = "#3A7B3A";

module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        headerMint: ECFDF5CC,
        echoDarkGreen: "#064E3B",
        bgStandard: "#F8FAF9",
        buttonGradientStart: BUTTON_GRADIENT_START,
        buttonGradientEnd: BUTTON_GRADIENT_END,
        buttonSurface: "#F6F7F6",
        buttonDark: "#303030",
      },
    },
  },
  plugins: [],
};
