import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a1628",
          900: "#0f2140",
          800: "#1a3358",
        },
        sand: {
          100: "#f5f0e8",
          200: "#e8dfd2",
          300: "#d4c4a8",
        },
        jungle: {
          500: "#40916c",
          600: "#2d6a4f",
        },
        ivory: {
          50: "#faf9f6",
        },
        gold: {
          400: "#c9a227",
          500: "#b8941f",
        },
        ocean: {
          400: "#4a90a4",
          500: "#3a7a8c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(74, 144, 164, 0.25)",
      },
    },
  },
};

export default preset;
