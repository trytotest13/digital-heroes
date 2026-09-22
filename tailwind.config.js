/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Digital Heroes Refined Heritage Golf & Charity Palette
        // Primary Action & Brand (Augusta / British Racing Pine)
        'primary-blue': '#11382B',
        'primary-red': '#B91C1C',
        'primary-green': '#11382B',
        'primary-amber': '#854D0E',
        'primary-gray': '#4B5563',

        // Secondary & Supporting
        'secondary-blue': '#1B4D3C',
        'secondary-red': '#DC2626',
        'secondary-green': '#1E5844',
        'secondary-orange': '#C2410C',
        'secondary-light-gray': '#F3F4F6',

        // Typography
        'dark-gray': '#0F172A',
        'medium-gray': '#334155',
        'light-gray': '#64748B',

        // Status Colors - Sophisticated, low-saturation
        'success': '#15803D',
        'success-light': '#16A34A',
        'success-pale': '#F0FDF4',
        'danger': '#BE123C',
        'danger-light': '#E11D48',
        'danger-pale': '#FFF1F2',
        'warning': '#A16207',
        'warning-light': '#CA8A04',
        'warning-pale': '#FEFCE8',

        // UI Surfaces & Neutrals
        'cream': '#FBFBFA',
        'mist': '#F1F3F2',
        'sand': '#EAECEB',
        'white': '#FFFFFF',
        'line': '#E4E7E5',

        // Text Tokens
        'body': '#334155',
        'text': '#0F172A',
        'ink': '#0F172A',
        'ink-surface': '#0F172A',
        'muted': '#64748B',

        // Brand Pine Tokens (Master Augusta Green)
        pine: "#11382B",
        "pine-light": "#1B4D3C",
        "pine-deep": "#0A241C",
        "pine-muted": "#2D5F4C",

        // Warm Gold / Bronze Accents
        gold: "#B45309",
        "gold-pale": "#FEFCE8",
        amber: "#854D0E",
        sage: "#1E5844",

        "ink-border": "#1E293B",
        "ink-muted": "#64748B",
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
