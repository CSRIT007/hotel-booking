/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#f0f9f4',
          100: '#dcf3e6',
          200: '#bce6d0',
          300: '#8bd3b1',
          400: '#54b88c',
          500: '#2f9d6e',
          600: '#1f7d57',
          700: '#1a6447',
          800: '#17503a',
          900: '#144231',
        },
        warm: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d9c0',
          300: '#e8be96',
          400: '#da9a6a',
          500: '#cd7f4a',
        },
      },
    },
  },
  plugins: [],
}
