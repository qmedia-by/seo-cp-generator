import type { Config } from "tailwindcss";

// Фирстиль Qmedia: чёрный + фирменный жёлтый, зелёный доп.акцент.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFDE00",
          black: "#080808",
          ink: "#151515",
          green: "#53BD35",
          gray: "#666666",
          mute: "#8D8D8D",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
