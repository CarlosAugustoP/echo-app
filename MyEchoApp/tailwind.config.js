/** @type {import('tailwindcss').Config} */
const ECFDF5CC = "#ECFDF5CC";

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
        bgStandard: "##f8faf9"
      },
    },
  },
  plugins: [],
};
