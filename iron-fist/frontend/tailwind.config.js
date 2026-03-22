/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: '#121214',
        surfaceLight: '#1d1d20',
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        accent: '#f59e0b',
        danger: '#ef4444',
        success: '#10b981',
        textMain: '#f3f4f6',
        textMuted: '#9ca3af'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
}
