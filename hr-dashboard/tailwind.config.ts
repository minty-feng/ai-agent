import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'hr-green': '#39424e',
        'hr-dark': '#1e2022',
        'hr-light': '#f4f4f4',
      },
    },
  },
  plugins: [],
};
export default config;
