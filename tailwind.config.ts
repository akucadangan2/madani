import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

// Warna diambil dari logo MADANI: hijau, teal, dan navy (tulisan MADANI).
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        lg: '0.875rem',
        xl: '1.25rem',
        '2xl': '1.75rem',
      },
      colors: {
        primary: {
          50: '#F1F9E8', 100: '#DDF1C6', 200: '#C0E59A', 300: '#A5D86B', 400: '#86C644',
          500: '#67B022', 600: '#559419', 700: '#427313', 800: '#355C12', 900: '#2B4C0C', 950: '#162A07',
        },
        secondary: {
          50: '#E6F6F9', 100: '#C0E8EF', 200: '#92D6E3', 300: '#5FB8CB', 400: '#2D9BB2',
          500: '#027A93', 600: '#02647A', 700: '#014D5E', 800: '#013D4B', 900: '#01323D', 950: '#00202A',
        },
        ink: {
          50: '#EEF3FA', 100: '#DCE6F4', 200: '#B8CBE6', 300: '#8CA9D3', 400: '#4F78B3',
          500: '#264F8C', 600: '#143E73', 700: '#0C2A57', 800: '#091F42', 900: '#06152D',
        },
        sun: { 300: '#FFD97A', 400: '#FFC94D', 500: '#F5B52B' },
        neutral: {
          50: '#F6F8F8', 100: '#EDF1F1', 200: '#DDE4E4', 300: '#C6D0D2', 400: '#95A3A8',
          500: '#667781', 600: '#4B5B66', 700: '#34444F', 800: '#1E2E3E', 900: '#0F2038', 950: '#091628',
        },
        success: '#67B022',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#027A93',
      },
    },
  },
  plugins: [],
};

export default config;