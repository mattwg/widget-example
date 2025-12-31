/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Prefix all Tailwind classes to avoid conflicts with host app styles
  prefix: 'widget-',
  theme: {
    extend: {
      colors: {
        // Custom widget color palette
        widget: {
          primary: '#6366f1',
          'primary-hover': '#4f46e5',
          secondary: '#f1f5f9',
          accent: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          background: '#ffffff',
          surface: '#f8fafc',
          border: '#e2e8f0',
          text: '#1e293b',
          'text-muted': '#64748b',
        },
      },
      fontFamily: {
        widget: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'widget': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'widget-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};




