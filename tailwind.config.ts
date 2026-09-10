import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          alt: "var(--color-surface-alt)",
        },
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        accent: {
          DEFAULT: "var(--color-accent)",
          dark: "var(--color-accent-dark)",
          light: "var(--color-accent-light)",
          foreground: "var(--color-accent-foreground)",
          emphasis: "var(--color-accent-emphasis)",
        },
        nav: {
          inactive: "var(--color-nav-inactive)",
        },
        foreground: {
          DEFAULT: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        warm: {
          25: "var(--color-warm-25)",
          50: "var(--color-warm-50)",
          100: "var(--color-warm-100)",
          200: "var(--color-warm-200)",
          300: "var(--color-warm-300)",
          400: "var(--color-warm-400)",
          500: "var(--color-warm-500)",
          600: "var(--color-warm-600)",
          700: "var(--color-warm-700)",
          800: "var(--color-warm-800)",
          900: "var(--color-warm-900)",
        },
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
        finance: {
          income: "var(--color-income)",
          expense: "var(--color-expense)",
          balance: "var(--color-balance)",
          debt: "var(--color-debt)",
          variance: "var(--color-variance)",
        },
        chart: {
          1: "var(--color-chart-1)",
          2: "var(--color-chart-2)",
          3: "var(--color-chart-3)",
          4: "var(--color-chart-4)",
          5: "var(--color-chart-5)",
          6: "var(--color-chart-6)",
        },
      },
      fontFamily: {
        sans: ["var(--font-ui)", "sans-serif"],
        display: ["var(--font-ui)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
        button: "8px",
        input: "8px",
        badge: "999px",
      },
    },
  },
  plugins: [],
};
export default config;
