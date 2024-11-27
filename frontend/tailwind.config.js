/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryDark: "rgb(18, 18, 18)", // Custom dark color
        primarySecondary: "rgb(50, 50, 50)", 
      },
    },
  },
  plugins: [ ],
  darkMode: "class", // This enables the use of dark mode based on a class
}
