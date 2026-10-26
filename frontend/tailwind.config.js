/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Premium landing page color system
        'void': '#050509',
        'base': '#0A0A0F',
        'elevated': '#1A1A24',
        'border-subtle': '#1F1F2E',
        'border-strong': '#3A3A4A',
        'text-primary': '#F5F5FA',
        'text-secondary': '#A0A0B0',
        'text-muted': '#6B6B7E',
        'violet': '#7C3AED',
        'magenta': '#D946EF',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "hsl(160, 84%, 39%)",
        warning: "hsl(38, 92%, 50%)",
        danger: "hsl(0, 84%, 60%)",
        info: "hsl(217, 91%, 60%)",
        gold: "hsl(43, 96%, 56%)",
        agent: {
          triage: "hsl(217, 91%, 60%)",
          prosecutor: "hsl(0, 84%, 60%)",
          defender: "hsl(160, 84%, 39%)",
          judge: "hsl(43, 96%, 56%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      boxShadow: {
        glow: "0 0 24px -4px hsl(262.1 83.3% 57.8% / 0.35)",
        'glow-sm': "0 0 12px -2px hsl(262.1 83.3% 57.8% / 0.3)",
        'glow-accent': "0 0 24px -4px hsl(292 84% 61% / 0.35)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.3), 0 0 0 1px hsl(240 14% 19.2% / 0.6)",
        'card-hover': "0 8px 30px -6px rgb(0 0 0 / 0.5), 0 0 0 1px hsl(262.1 83.3% 57.8% / 0.35)",
      },
      keyframes: {
        // Floating animation for decorative particles
        "float": {
          "0%, 100%": { transform: "translateY(0px)", opacity: "0.3" },
          "50%": { transform: "translateY(-100px)", opacity: "0.6" },
        },
        // Marquee for trust bar
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        // Gradient shift
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "typing": {
          "0%, 60%, 100%": { content: "''" },
          "30%": { content: "'.'" },
          "60%": { content: "'..'" },
          "90%": { content: "'...'" },
        },
        "vs-clash": {
          "0%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.3)", opacity: 0.8 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        "gavel-strike": {
          "0%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-8px) scale(1.03)" },
          "60%": { transform: "translateY(2px) scale(0.98)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "expand-ring": {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "100%": { transform: "scale(1.5)", opacity: 0 },
        },
        "verdict-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 currentColor" },
          "50%": { boxShadow: "0 0 0 8px transparent" },
        },
      },
      animation: {
        "float": "float 8s ease-in-out infinite",
        "marquee": "marquee 30s linear infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "shimmer": "shimmer 1.8s linear infinite",
        "vs-clash": "vs-clash 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "gavel-strike": "gavel-strike 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "expand-ring": "expand-ring 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "verdict-pulse": "verdict-pulse 1s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
