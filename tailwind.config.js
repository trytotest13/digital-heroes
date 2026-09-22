/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surface palette — warm paper with richer warmth
        cream: "#faf8f1",
        paper: "#f5f2ea",
        sand: "#e8e2d6",
        
        // Primary — deep forest green (richer, more saturated)
        pine: "#1a4d3e",
        "pine-light": "#246350",
        "pine-deep": "#0f3328",
        "pine-muted": "#2d5e4a",
        
        // Accent — warm gold (more luminous)
        gold: "#c9952a",
        "gold-light": "#dbab4a",
        "gold-pale": "#f0dfa8",
        
        // Secondary — slate blue (for contrast categories)
        ocean: "#2a5a7a",
        "ocean-light": "#3a7a9f",
        "ocean-pale": "#d4e8f0",
        
        // Tertiary — warm terracotta
        clay: "#a0523e",
        "clay-light": "#b86852",
        "clay-pale": "#e8d0c8",
        
        // Neutral text scale
        ink: "#141816",
        body: "#2a3330",
        "body-light": "#4a5650",
        muted: "#6e7a74",
        "muted-light": "#93a09a",
        
        // Surface/border tokens
        mist: "#dfe9e1",
        line: "#d8ddd4",
        "line-light": "#e5e9e2",
        white: "#ffffff",
        
        // Status colors
        success: "#2d7a4f",
        "success-pale": "#d4eddf",
        danger: "#b84c4c",
        "danger-pale": "#f0d8d8",
        warning: "#b8860b",
        "warning-pale": "#f5ecd0",
        
        // Admin dark surfaces
        "ink-surface": "#111916",
        "ink-border": "#1e332a",
        "ink-muted": "#7a8a82",
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
