/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Rubik Variable"', 'Rubik', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0a0b0d',
          900: '#121418',
          850: '#16191e',
          800: '#1c1f25',
          700: '#272b33',
          600: '#353a44',
        },
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        pop: { '0%': { transform: 'scale(.9)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-4px)' }, '75%': { transform: 'translateX(4px)' } },
      },
      animation: {
        sheet: 'sheet .28s cubic-bezier(.2,.9,.3,1)',
        fade: 'fade .2s ease-out',
        pop: 'pop .22s ease-out',
        shake: 'shake .25s ease-in-out 2',
      },
    },
  },
  plugins: [],
}
