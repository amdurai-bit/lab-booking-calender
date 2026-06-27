import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Archive palette
        parchment: {
          50: "#fdf8f0",
          100: "#f9edd8",
          200: "#f2d9b0",
          300: "#e8bf80",
          400: "#d9a054",
          500: "#c8843a",
          600: "#b06930",
          700: "#8f5029",
          800: "#744026",
          900: "#5e3523",
        },
        ink: {
          50: "#f5f0eb",
          100: "#e8ddd3",
          200: "#d1bba7",
          300: "#b89379",
          400: "#9a6e55",
          500: "#7d5240",
          600: "#5e3b2e",
          700: "#3d251d",
          800: "#2a1912",
          900: "#160c09",
        },
        sepia: {
          DEFAULT: "#704214",
          light: "#a0622a",
          dark: "#3d220a",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
