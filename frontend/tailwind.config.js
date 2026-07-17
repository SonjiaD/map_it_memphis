/** @type {import('tailwindcss').Config} */
// MAPP It Memphis theme: University of Memphis blue (primary) + Stax-gold accent,
// with a warm rust ramp reserved for resident-drawn data layers so resident data
// always reads warm against the cool official blues.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out both',
      },
      colors: {
        // University of Memphis blue ramp (anchor ~#003087)
        primary: {
          50:  '#eef3fb',
          100: '#d9e4f6',
          200: '#b3c9ec',
          300: '#84a7df',
          400: '#4f7ecd',
          500: '#2458b3',
          600: '#12419c',
          700: '#003087',
          800: '#002567',
          900: '#001b4d',
        },
        // Stax gold ramp (anchor ~#f0b323)
        accent: {
          50:  '#fdf8ec',
          100: '#faeecc',
          200: '#f6df9e',
          300: '#f2cd67',
          400: '#f0b323',
          500: '#d99c14',
          600: '#b57d0e',
          700: '#8f5f0c',
          800: '#6b460d',
          900: '#4a300b',
        },
        // Warm rust, reserved for resident-drawn data (heatmap, boundaries, pins)
        rust: {
          50:  '#faf1ec',
          100: '#f5e0d6',
          200: '#e8c4b0',
          300: '#dba88a',
          400: '#d08c6a',
          500: '#c96d4f',
          600: '#b8593a',
          700: '#9a4a2f',
          800: '#7c3b25',
          900: '#5e2d1b',
        },
        surface: {
          page:  '#f4f7fb',
          card:  '#ffffff',
          muted: '#e9eef6',
        },
        border: {
          DEFAULT: '#d7dfeb',
          input:   '#c3cedd',
        },
      },
    },
  },
  plugins: [],
}
