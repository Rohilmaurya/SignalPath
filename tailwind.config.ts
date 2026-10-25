import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obs: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          surfaceElevated: "#F4F4F5",
          border: "#E4E4E7",
          borderLight: "#D4D4D8",
          text: "#18181B",
          textMuted: "#52525B",
          textDim: "#71717A",
          accent: "#18181B",
          accentCoral: "#FC4778",
          accentCyan: "#0284C7",
          accentGlow: "rgba(252, 71, 120, 0.12)",
          riskLow: "#059669",
          riskMedium: "#D97706",
          riskHigh: "#EA580C",
          riskCritical: "#DC2626",
          cascade: "#9333EA",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beacon": "beacon 2s ease-in-out infinite",
      },
      keyframes: {
        beacon: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.15)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
