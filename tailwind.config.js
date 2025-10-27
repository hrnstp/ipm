/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#ffffff',
          dark: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#fafafa',
          dark: '#111111',
        },
        border: {
          DEFAULT: '#e5e5e5',
          dark: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
};
