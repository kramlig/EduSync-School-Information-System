/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'Inter', 'Arial', 'sans-serif'],
        cursive: ['Brush Script MT', 'Lucida Handwriting', 'cursive']
      }
    }
  },
  plugins: []
};
