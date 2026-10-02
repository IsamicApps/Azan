/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8eb',
          100: '#f5eece',
          200: '#eddca1',
          300: '#e3c46d',
          400: '#d9ab3d',
          500: '#c59325',
          600: '#a8731b',
          700: '#845318',
          800: '#6d431a',
          900: '#5c371a',
          950: '#341c0b',
        },
        emerald: {
          920: '#041d15',
          950: '#02120d',
        },
        obsidian: {
          800: '#12141c',
          900: '#0b0c10',
          950: '#06070a',
        },
        navy: {
          900: '#081426',
          950: '#040b15',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Amiri', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['"Amiri"', '"Scheherazade New"', 'Traditional Arabic', 'serif'],
        display: ['"Cinzel Decorative"', '"Cormorant Garamond"', 'serif']
      }
    },
  },
  plugins: [],
}
