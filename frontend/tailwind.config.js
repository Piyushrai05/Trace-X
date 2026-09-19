/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070B10',
        surface: {
          DEFAULT: '#0D131D',
          elevated: '#131B28',
          hover: '#182334',
          subtle: '#0A0F16',
        },
        border: {
          DEFAULT: '#1B2737',
          bright: '#26374D',
          glow: 'rgba(6,182,212,0.3)',
        },
        text: {
          DEFAULT: '#F1F5F9',
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        cyan: {
          DEFAULT: '#00E5FF',
          bright: '#22D3EE',
          dim: '#0891B2',
          glow: 'rgba(0,229,255,0.2)',
          subtle: 'rgba(0,229,255,0.08)',
        },
        red: {
          DEFAULT: '#EF4444',
          bright: '#F87171',
          dim: '#7F1D1D',
          glow: 'rgba(239,68,68,0.25)',
          subtle: 'rgba(239,68,68,0.1)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          bright: '#FBBF24',
          dim: '#78350F',
          glow: 'rgba(245,158,11,0.2)',
          subtle: 'rgba(245,158,11,0.1)',
        },
        green: {
          DEFAULT: '#10B981',
          bright: '#34D399',
          dim: '#064E3B',
          glow: 'rgba(16,185,129,0.2)',
          subtle: 'rgba(16,185,129,0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(0, 229, 255, 0.25)',
        'red-glow': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(38, 55, 77, 0.3) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
