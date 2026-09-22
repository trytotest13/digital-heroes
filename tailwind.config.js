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
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "70%": { transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "alert-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "pop-in": "pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "alert-in": "alert-in 0.25s ease-out both",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        marquee: "marquee var(--duration) infinite linear",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
      },
    },
  },
  plugins: [],
};
