/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#05080F',
          900: '#0A0F1E',
          850: '#0D1321',
          800: '#111827',
          750: '#162035',
          700: '#1C2940',
          600: '#243050',
          500: '#2E3B60',
          400: '#3D4E78',
        },
        paper: {
          DEFAULT: '#FBF8F1',
          card: '#FFFFFF',
          hover: '#F4F0E6',
        },
        kc: {
          500: '#F0A500',
          400: '#F4B823',
          300: '#F7CA46',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        forest: {
          700: '#065F46',
          600: '#047857',
          500: '#059669',
          400: '#10B981',
          300: '#34D399',
          100: '#D1FAE5',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        book: '6px 6px 18px rgba(0,0,0,0.35), 2px 2px 6px rgba(0,0,0,0.25)',
        'book-hover': '12px 18px 32px rgba(0,0,0,0.45), 4px 6px 12px rgba(0,0,0,0.25)',
        card: '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
        'glow-kc': '0 0 20px rgba(240, 165, 0, 0.30)',
        'glow-green': '0 0 20px rgba(5, 150, 105, 0.30)',
      },
      backgroundImage: {
        'gradient-kc': 'linear-gradient(135deg, #F0A500 0%, #F4B823 50%, #F7CA46 100%)',
        'gradient-navy': 'linear-gradient(135deg, #0A0F1E 0%, #162035 50%, #1C2940 100%)',
        'gradient-green': 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'count-pulse': 'countPulse 0.5s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        countPulse: {
          '0%': { boxShadow: '0 0 0 rgba(240,165,0,0)' },
          '50%': { boxShadow: '0 0 16px rgba(240,165,0,0.5)' },
          '100%': { boxShadow: '0 0 0 rgba(240,165,0,0)' },
        },
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
