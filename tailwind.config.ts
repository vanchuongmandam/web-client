import type {Config} from 'tailwindcss';
import {fontFamily} from 'tailwindcss/defaultTheme';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        serif: ['var(--font-sans)', ...fontFamily.sans],
        headline: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // ── VCMD Design Palette ──
        'warm-cream': '#fcf9f2',
        'warm-sand': '#e6dfd3',
        'warm-linen': '#ebe2cf',
        'warm-ivory': '#f7f0e3',
        sand: {
          DEFAULT: '#ebdcb9',
          light: '#e6dfd3',
          dark: '#ccbfae',
          muted: '#bca68d',
        },
        'sage-border': '#d2e7dd',
        forest: {
          DEFAULT: '#4c6b54',
          dark: '#3b5341',
          bright: '#3c6b41',
          deepest: '#2b3a32',
          night: '#1d2722',
          tint: '#ebf4ef',
        },
        earth: {
          DEFAULT: '#483d31',
          dark: '#3e342a',
          muted: '#5a5045',
          light: '#7e7363',
          lighter: '#8c7e6c',
        },
        gold: {
          DEFAULT: '#cbb685',
          light: '#eae0d2',
        },
        'category-red': '#8e2929',
        'category-red-dark': '#432d27',
        'category-brown': '#5c3e35',
        'category-copper': '#a37055',
        'category-blue': '#4f6b8c',
        'category-blue-dark': '#1f2d3d',
        'category-blue-night': '#131b25',
        'category-purple': '#7a5879',
        'category-purple-dark': '#3b2b3a',
        'category-purple-night': '#261c25',
        'pastel-green': '#e9f1e8',
        'pastel-blue': '#e9f1f6',
        'pastel-purple': '#f5eaf4',
        'pastel-warm': '#f4eae1',
        'pastel-pink': '#f7eaf0',
        'viewer-dark': '#141210',
        'viewer-dark-surface': '#24201b',
        'viewer-dark-border': '#28231e',
        'sage-text': '#8ea48a',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
