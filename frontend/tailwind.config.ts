import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wc: {
          bg: '#04070E',
          surface: '#080F1C',
          surface2: '#0D1829',
          border: '#152136',
          'border-bright': '#1E3152',
          gold: '#F5A623',
          'gold-light': '#FFD166',
          green: '#00C87A',
          'green-dark': '#009960',
          red: '#F03E3E',
          text: '#E8EDF5',
          muted: '#5B6E8C',
          dim: '#2A3A52',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Bebas Neue"', 'sans-serif'],
        score: ['"Bebas Neue"', 'monospace'],
        body: ['"Barlow"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 166, 35, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(245, 166, 35, 0.3)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        'fade-in-up': 'fadeInUp 0.7s ease forwards',
        shimmer: 'shimmer 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
