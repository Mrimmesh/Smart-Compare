/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4A90E2', // Example primary color (a nice blue)
        'brand-secondary': '#50E3C2', // Example secondary color (a teal/mint)
        'brand-accent': '#F5A623', // Example accent color (orange)
        'brand-dark': '#2c3e50', // Dark color for text or backgrounds
        'brand-light': '#ecf0f1', // Light color for text or backgrounds
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
} 