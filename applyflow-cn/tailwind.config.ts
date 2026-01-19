import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111827',
        secondary: '#6B7280',
        border: '#E5E7EB',
        background: '#FFFFFF',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        }
      },
      maxWidth: {
        'content': '1080px',
      },
      lineHeight: {
        'relaxed': '1.5',
      }
    }
  },
  plugins: []
};

export default config;
