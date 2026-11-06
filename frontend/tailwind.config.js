/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abhaya: {
          ink: "#171717",
          ivory: "#F3EBDD",
          red: "#B52D27",
          mustard: "#D5B94D",
          pink: "#D58D9D",
          grey: "#77736B",
          paper: "#FAF9F5",
        },
      },
      fontFamily: {
        anton: ['"Anton"', 'Impact', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        oswald: ['"Oswald"', 'sans-serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        typewriter: ['"Special Elite"', 'monospace'],
        caveat: ['"Caveat"', 'cursive'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
