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
        primary: {
          DEFAULT: '#2563EB',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563EB',
          700: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#F97316',
          500: '#F97316',
          600: '#ea6c0a',
        },
        accent: {
          DEFAULT: '#10B981',
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          DEFAULT: '#EF4444',
          500: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
