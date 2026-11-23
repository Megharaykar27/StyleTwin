/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#0B0614", 2: "#120A22", 3: "#1A1030" },
        aura: { violet: "#8B5CF6", pink: "#EC4899", blue: "#3B82F6", cyan: "#22D3EE", lime: "#A3E635" },
      },
      fontFamily: {
        display: ['"Syne"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        drift: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "33%": { transform: "translate(6%,-8%) scale(1.15)" }, "66%": { transform: "translate(-6%,6%) scale(0.9)" } },
        shine: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        scan: { "0%": { top: "0%" }, "100%": { top: "100%" } },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite reverse",
        shine: "shine 3s linear infinite",
        scan: "scan 1.6s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
