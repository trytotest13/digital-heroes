/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f5f3ec",
        ink: "#101514",
        pine: "#173d35",
        "pine-deep": "#102b25",
        sage: "#8fae9b",
        mist: "#dce7df",
        amber: "#d8a15d",
        body: "#18201d",
        muted: "#6b746f",
        line: "#d7dad4",
        danger: "#b84c4c",
      },
      fontFamily: {
        display: ['"DM Sans"', '"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
