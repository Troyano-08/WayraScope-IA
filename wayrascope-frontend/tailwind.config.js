/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBlue: '#0A192F',
        spaceBlue: '#112240',
        neonGreen: '#64FFDA',
      },
    },
  },
  plugins: [],
}
