import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // تفعيل dark mode مع next-themes
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // تركواز (ستايل تركيا المودرن)
          600: '#0d9488',
          700: '#0a4256',
          800: '#073246',
          900: '#052235',
          950: '#031626',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b', // ذهبي
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        cairo: ['var(--font-cairo)'],
      }
    },
  },
  plugins: [],
};
export default config;