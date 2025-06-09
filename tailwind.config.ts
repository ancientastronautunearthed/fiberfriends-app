import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        headline: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        code: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // New gradient color stops
        gradient: {
          start: 'hsl(var(--gradient-start))',
          end: 'hsl(var(--gradient-end))',
        },
        glow: 'hsl(var(--glow-color))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        // Glow shadows
        'glow-sm': '0 0 15px hsl(var(--primary) / 0.3)',
        'glow': '0 0 25px hsl(var(--primary) / 0.5)',
        'glow-lg': '0 0 50px hsl(var(--primary) / 0.6)',
        'glow-xl': '0 0 100px hsl(var(--primary) / 0.7)',
        // Inner shadows for depth
        'inner-glow': 'inset 0 0 20px hsl(var(--primary) / 0.2)',
        'inner-dark': 'inset 0 2px 4px hsl(var(--background) / 0.5)',
        // Elevation shadows
        'elevation-low': '0 2px 8px hsl(var(--background) / 0.4)',
        'elevation-medium': '0 4px 16px hsl(var(--background) / 0.5)',
        'elevation-high': '0 8px 32px hsl(var(--background) / 0.6)',
        // Neon shadows
        'neon-blue': '0 0 20px hsl(217 100% 50% / 0.8), 0 0 40px hsl(217 100% 50% / 0.6)',
        'neon-purple': '0 0 20px hsl(260 100% 60% / 0.8), 0 0 40px hsl(260 100% 60% / 0.6)',
      },
      backgroundImage: {
        // Gradient patterns
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-fiber': 'linear-gradient(135deg, hsl(var(--primary) / 0.1), transparent 40%, hsl(var(--accent) / 0.1))',
        'gradient-mesh': 'radial-gradient(at 20% 30%, hsl(var(--primary) / 0.2) 0%, transparent 50%), radial-gradient(at 80% 70%, hsl(var(--accent) / 0.2) 0%, transparent 50%)',
        // Noise texture
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02' /%3E%3C/svg%3E\")",
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '48px',
      },
      animation: {
        // Existing animations
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // New animations
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'fiber-float': 'fiber-float 20s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'slide-in-left': 'slide-in-left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-up': 'slide-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-down': 'slide-in-down 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.5s ease-out',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'damage-flash': 'damage-flash-enhanced 0.7s ease-in-out',
        'fiber-weave': 'fiber-weave 1.5s ease-in-out infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'text-shimmer': 'text-shimmer 3s linear infinite',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'fiber-float': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
          '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
          },
          '50%': { 
            opacity: '0.8',
            boxShadow: '0 0 40px hsl(var(--primary) / 0.8)',
          },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'damage-flash-enhanced': {
          '0%, 100%': {
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            boxShadow: 'none',
          },
          '50%': {
            backgroundColor: 'hsl(var(--destructive))',
            borderColor: 'hsl(var(--destructive))',
            boxShadow: '0 0 40px hsl(var(--destructive) / 0.6)',
          },
        },
        'fiber-weave': {
          '0%, 100%': { transform: 'scaleX(0)', opacity: '0' },
          '50%': { transform: 'scaleX(1)', opacity: '1' },
        },
        'morph': {
          '0%, 100%': { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' },
          '50%': { borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%' },
        },
        'glow-pulse': {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.2)' },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
        '1200': '1200ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      scale: {
        '98': '.98',
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
      },
      blur: {
        xs: '2px',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--border))',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-bg': 'hsl(var(--muted))',
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border))',
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'), // Added this line
    // Custom plugin for glass utilities
    function({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.glass-sm': {
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          backgroundColor: 'hsl(var(--card) / 0.3)',
          border: '1px solid hsl(var(--border) / 0.3)',
        },
        '.glass': {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'hsl(var(--card) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.5)',
        },
        '.glass-lg': {
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'hsl(var(--card) / 0.8)',
          border: '1px solid hsl(var(--border) / 0.7)',
        },
        '.text-gradient': {
          backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.bg-grid': {
          backgroundImage: `linear-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--border) / 0.2) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        },
        '.bg-dots': {
          backgroundImage: `radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        },
      })
    },
  ],
} satisfies Config;