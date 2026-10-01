/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#064E29',
          greenLight: '#0A5C36',
          greenDark: '#022C15',
          emerald: '#10B981',
          gold: '#F59E0B',
          goldDark: '#D97706',
          goldLight: '#FBBF24',
          amber: '#F39C12'
        }
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        afriloan: {
          "primary": "#064E29",
          "primary-focus": "#022C15",
          "secondary": "#F59E0B",
          "accent": "#0A5C36",
          "neutral": "#1F2937",
          "base-100": "#fcfcfc",
          "info": "#0284c7",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
};
