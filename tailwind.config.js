/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#004B34', // headers, sheets, major buttons
        mint: '#10B981', // status tags, price bubbles, confirm buttons
        cream: '#F4F6F5', // app canvas
        crisp: '#FFFFFF', // cards, chips, menu boxes
        accent: '#FF7A45', // rating badge ONLY
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
