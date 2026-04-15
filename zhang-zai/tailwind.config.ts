import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['"Noto Serif SC"', '"Noto Serif"', 'ui-serif', 'Georgia'],
      },
      colors: {
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        ink: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a28',
          600: '#222235',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow-gold': 'glowGold 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowGold: {
          '0%': { textShadow: '0 0 8px rgba(251,191,36,0.3)' },
          '100%': { textShadow: '0 0 24px rgba(251,191,36,0.8)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
