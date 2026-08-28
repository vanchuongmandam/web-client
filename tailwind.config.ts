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
        // ── VCMD Design Palette (Wine Red / Antique Gold / Warm Paper) ──
        'warm-cream': '#fdfbf7', // #FDFBF7 - Giấy trầm sáng
        'warm-sand': '#f5f1e9',  // #F5F1E9 - Giấy trầm ấm
        'warm-linen': '#efe9dc', // #EFE9DC
        'warm-ivory': '#faf6ee', // #FAF6EE
        sand: {
          DEFAULT: '#e5dfd5',    // #E5DFD5 - Đường kẻ giấy
          light: '#efebe3',
          dark: '#d5cdc0',
          muted: '#beb5a5',
        },
        'sage-border': '#e5dfd5',
        'sage-text': '#c5a059',
        // ── Primary Action: Wine Red / Crimson Velvet (Đỏ Rượu Cung Đình) ──
        wine: {
          DEFAULT: '#a34355',
          dark: '#833241',
          bright: '#c24f65',
          deepest: '#4a1b24',
          night: '#2b1016',
          tint: '#fdf2f4',
        },
        crimson: {
          DEFAULT: '#a34355',
          dark: '#833241',
          light: '#c24f65',
          deepest: '#4a1b24',
        },
        // Safe Migration Alias: 'forest' mapped to Wine Red shades
        forest: {
          DEFAULT: '#a34355',
          dark: '#833241',
          bright: '#c24f65',
          deepest: '#4a1b24',
          night: '#2b1016',
          tint: '#fdf2f4',
        },
        // ── Typography: Earth Ink (Mực Nâu Trầm) ──
        earth: {
          DEFAULT: '#3d3534',    // #3D3534
          dark: '#2c2625',
          muted: '#7a6d6b',    // #7A6D6B
          light: '#9e908e',
          lighter: '#b8aca9',
        },
        // ── Accent: Antique Gold (Vàng Đồng Cổ) ──
        gold: {
          DEFAULT: '#c5a059',    // #C5A059
          light: '#dfc68e',
          dark: '#a17e38',
          tint: '#faf5eb',
        },
        // ── Category Accents ──
        'category-red': '#a34355',
        'category-red-dark': '#4a1b24',
        'category-brown': '#5c3e35',
        'category-copper': '#a37055',
        'category-blue': '#4f6b8c',
        'category-blue-dark': '#1f2d3d',
        'category-blue-night': '#131b25',
        'category-purple': '#7a5879',
        'category-purple-dark': '#3b2b3a',
        'category-purple-night': '#261c25',
        'pastel-green': '#fdf2f4',
        'pastel-blue': '#e9f1f6',
        'pastel-purple': '#f5eaf4',
        'pastel-warm': '#f4eae1',
        'pastel-pink': '#fdf2f4',
        'pastel-gold': '#faf5eb',
        'viewer-dark': '#141210',
        'viewer-dark-surface': '#24201b',
        'viewer-dark-border': '#28231e',
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
