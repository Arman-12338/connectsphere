/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark mode based on className
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          500: '#5c7cff',
          600: '#3d53eb',
          700: '#2f3ecf',
          800: '#2833a8',
          900: '#252e85',
          950: '#16194f',
        },
        dark: {
          50: '#f6f6f7',
          100: '#eef0f2',
          200: '#dcdfe3',
          300: '#bfc5cc',
          400: '#9ca5af',
          550: '#757f8c',
          600: '#5e6875',
          750: '#464f59',
          800: '#323940',
          850: '#22272c',
          900: '#1b1e22',
          950: '#111215',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        }
      }
    },
  },
  plugins: [],
}
