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
          bg: "#080C14",
          surface: "#0F172A",
          surfaceElevated: "#1E293B",
          border: "#334155",
          borderLight: "#475569",
          text: "#F8FAFC",
          textMuted: "#94A3B8",
          textDim: "#64748B",
          accent: "#38BDF8",
          accentGlow: "rgba(56, 189, 248, 0.15)",
          riskLow: "#10B981",
          riskMedium: "#F59E0B",
          riskHigh: "#F97316",
          riskCritical: "#EF4444",
          cascade: "#A855F7",
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
