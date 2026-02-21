/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gan-yellow': '#ffcc00',
        'gan-red': '#ff3333',
        'gan-cyan': '#5CE1E6',
        'gan-black': '#0a0a0a',
        'gan-gold': '#D4A84B',
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
