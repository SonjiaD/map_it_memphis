/** @type {import('tailwindcss').Config} */
// MAPP It Memphis design system:
// - primary = ink (warm charcoal, high contrast) for text, dark bands, primary buttons
// - accent = terracotta, the color of resident-drawn boundaries (the project's own mark)
// - paper surfaces, hairline borders
// Map layer hues (slate blue tracts, violet zips, gold district, rust boundaries) are
// hardcoded in the map components as categorical colors and unaffected by these tokens.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
      },
      colors: {
        // Ink: warm charcoal ramp, 900 is near-black for maximum contrast
        primary: {
          50:  '#f6f6f4',
          100: '#e8e8e4',
          200: '#d2d2cb',
          300: '#b2b3aa',
          400: '#8b8d84',
          500: '#6e7069',
          600: '#575952',
          700: '#404239',
          800: '#2a2c26',
          900: '#191b16',
        },
        // Terracotta: resident-drawn-line color, the single brand accent
        accent: {
          50:  '#fdf3ee',
          100: '#fae2d4',
          200: '#f4c3a8',
          300: '#ea9c74',
          400: '#dd7346',
          500: '#cd5423',
          600: '#b34418',
          700: '#933615',
          800: '#752c16',
          900: '#5e2513',
        },
        // Rust kept as an alias of the accent family for resident-data map layers
        rust: {
          400: '#dd7346',
          500: '#cd5423',
          600: '#b34418',
          700: '#933615',
        },
        surface: {
          page:  '#faf9f6',
          card:  '#ffffff',
          muted: '#f1f0ea',
        },
        border: {
          DEFAULT: '#e2e0d8',
          input:   '#cfccc2',
        },
      },
    },
  },
  plugins: [],
}
