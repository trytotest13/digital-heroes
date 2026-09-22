/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Digital Heroes PRD Color Palette
        // Primary Colors
        'primary-blue': '#1E3A8A',
        'primary-red': '#DC2626',
        'primary-green': '#10B981',
        'primary-amber': '#F59E0B',
        'primary-gray': '#6B7280',

        // Secondary Colors
        'secondary-blue': '#3B82F6',
        'secondary-red': '#EF4444',
        'secondary-green': '#22C55E',
        'secondary-orange': '#F97316',
        'secondary-light-gray': '#E5E7EB',

        // Typography Colors
        'dark-gray': '#111827',
        'medium-gray': '#374151',
        'light-gray': '#9CA3AF',

        // Status Colors
        'success': '#10B981',
        'success-light': '#22C55E',
        'success-pale': '#D1FAE5',
        'danger': '#DC2626',
        'danger-light': '#EF4444',
        'danger-pale': '#FECACA',
        'warning': '#F59E0B',
        'warning-light': '#F97316',
        'warning-pale': '#FEF3C7',

        // UI Backgrounds
        'cream': '#F9FAFB',
        'mist': '#E5E7EB',
        'sand': '#F3F4F6',
        'white': '#FFFFFF',
        'line': '#E5E7EB',

        // Text Colors
        'body': '#374151',
        'text': '#111827',
        'ink': '#111827',
        'cream': '#F9FAFB',
        'ink-surface': '#111827',
        'muted': '#9CA3AF',

        // Legacy token names for compatibility
        pine: "#1E3A8A",
        "pine-light": "#3B82F6",
        "pine-deep": "#172554",
        "pine-muted": "#3B82F6",

        gold: "#F59E0B",
        "gold-pale": "#FEF3C7",
        amber: "#F59E0B",
        sage: "#10B981",

        "ink-surface": "#111827",
        "ink-border": "#1F2937",
        "ink-muted": "#9CA3AF",
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
