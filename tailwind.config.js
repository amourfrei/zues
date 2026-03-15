/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF85A1',
        secondary: '#B5A4F5',
        accent: '#7DD8B8',
      },
    },
  },
  plugins: [],
};
