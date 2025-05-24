import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      colors: {
        // Design System Colors
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-tertiary": "var(--color-bg-tertiary)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        "border-primary": "var(--color-border-primary)",
        "border-secondary": "var(--color-border-secondary)",
        "primary-blue": "var(--color-primary-blue)",
        "primary-blue-hover": "var(--color-primary-blue-hover)",
        "success-green": "var(--color-success-green)",
        "warning-yellow": "var(--color-warning-yellow)",
        "error-red": "var(--color-error-red)",
        "assistant-gray": "var(--color-assistant-gray)",
        
        // Legacy shadcn/ui colors for backward compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontSize: {
        "display-large": ["var(--font-size-display-large)", { lineHeight: "var(--line-height-display-large)" }],
        "display-medium": ["var(--font-size-display-medium)", { lineHeight: "var(--line-height-display-medium)" }],
        "heading-large": ["var(--font-size-heading-large)", { lineHeight: "var(--line-height-heading-large)" }],
        "heading-medium": ["var(--font-size-heading-medium)", { lineHeight: "var(--line-height-heading-medium)" }],
        "body-large": ["var(--font-size-body-large)", { lineHeight: "var(--line-height-body-large)" }],
        "body-medium": ["var(--font-size-body-medium)", { lineHeight: "var(--line-height-body-medium)" }],
        "body-small": ["var(--font-size-body-small)", { lineHeight: "var(--line-height-body-small)" }],
        "code": ["var(--font-size-code)", { lineHeight: "var(--line-height-code)" }],
      },
      fontWeight: {
        regular: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
        "4xl": "var(--spacing-4xl)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        small: "var(--border-radius-small)",
        large: "var(--border-radius-large)",
      },
      height: {
        "button-primary": "var(--button-height-primary)",
        "button-secondary": "var(--button-height-secondary)",
        "button-small": "var(--button-height-small)",
        "input": "var(--input-height)",
      },
      boxShadow: {
        light: "var(--shadow-light)",
        elevated: "var(--shadow-elevated)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
        layout: "var(--transition-layout)",
        page: "var(--transition-page)",
      },
      animation: {
        "button-hover": "scale 150ms ease-in-out",
        "button-press": "scale 100ms ease-out",
        "focus-ring": "opacity 200ms ease-in-out",
        "loading-spinner": "spin 1s linear infinite",
        "message-appear": "slideUpFadeIn 200ms ease-out",
        "sidebar-toggle": "width 300ms ease-in-out",
        "page-transition": "opacity 250ms ease-in-out",
        "error-shake": "shake 300ms ease-in-out",
        "success-flash": "flash 200ms ease-out",
        "skeleton-fade": "fadeIn 150ms ease-out",
        "empty-state": "scaleIn 400ms ease-out",
      },
      keyframes: {
        slideUpFadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        flash: {
          "0%": { backgroundColor: "var(--color-success-green)" },
          "100%": { backgroundColor: "transparent" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scale: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
