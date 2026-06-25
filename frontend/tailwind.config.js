/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Executive Slate Base
        background: '#0f172a', // Level 0
        surface: {
          dark: {
            base: '#0f172a', // Maps Level 0
            elevated: '#1e293b', // Level 1 (Cards/Sidebar)
            'container-high': '#334155', // Level 2 (Modals/Hover)
            'container-highest': '#475569', 
          }
        },
        primary: {
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Core Primary Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Semantic Colors
        success: '#059669', // Emerald 600
        warning: '#d97706', // Amber 600
        error: '#e11d48',   // Rose 600
        'on-surface-dark': '#f8fafc', // High contrast silver
        'outline': '#94a3b8',         // Muted slate
        'outline-variant': '#cbd5e1',
        'outline-dark': '#334155',    // 1px borders
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline-lg-mobile': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.02em' }],
        'mono-sm': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem', // 4px engineered sharp
        'md': '0.375rem',
        'lg': '0.5rem',       // 8px cards
        'xl': '0.75rem',
        'full': '9999px',
      },
      spacing: {
        'base': '4px',
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '40px',
        'xxl': '64px',
      },
      boxShadow: {
        'subtle': 'none', // Remove shadows as requested, tonal layering instead
        'elevated': 'none',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'geist': ['Geist', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
