/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0b0f",
        panel: "#13151c",
        panel2: "#1a1d27",
        line: "#262a36",
        brand: { DEFAULT: "#6d5efc", soft: "#8b7cff" },
        accent: "#22d3a8",
        hot: "#ff5a52",
        muted: "#8b91a3",
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { glow: "0 0 0 1px rgba(109,94,252,.25), 0 18px 60px -20px rgba(109,94,252,.5)" },
    },
  },
  plugins: [],
};
