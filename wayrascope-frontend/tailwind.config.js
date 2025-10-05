/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          DEFAULT: '#0b1020'
          // ❌ NO uses "card" con opacidad fija aquí; lo haremos con CSS vars
        },
        accent: {
          DEFAULT: '#6EE7F9',
          secondary: '#22d3ee'
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(110, 231, 249, 0.25)'
      }
    }
  },
  plugins: []
}
