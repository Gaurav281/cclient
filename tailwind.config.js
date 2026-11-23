/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#000000',
          900: '#0A0A0A',
          850: '#121212',
          800: '#181818',
          750: '#222222',
          700: '#2C2C2C',
          600: '#404040',
        },
        sky: {
          500: '#0EA5E9',
          400: '#38BDF8',
          300: '#7DD3FC',
          200: '#BAE6FD',
          100: '#E0F2FE',
        },
      },
      boxShadow: {
        card: '0 2px 10px 0 rgba(0, 0, 0, 0.5)',
        button: '0 2px 6px 0 rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
