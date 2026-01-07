import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Admin Theme Colors (From Screenshots)
        'admin-dark': '#0f172a', // Deep slate blue/black
        'admin-card': '#1e293b', // Lighter slate for cards
        'admin-accent': '#10b981', // Emerald green
        'admin-text': '#f8fafc', // White/Slate-50
        'admin-muted': '#94a3b8', // Muted text
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0b2926ff',
          800: '#02726bff',
          900: '#20504dff',
          950: '#078d8dff',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        cairo: ['var(--font-cairo)'],
      },
      // ✅ نظام shadows موحد - 3 مستويات فقط
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // حذف: md, xl, 2xl - استخدام 3 فقط
      },
      borderRadius: {
        'curved': '80px'
      },
    },
  },
  plugins: [],
};
export default config;