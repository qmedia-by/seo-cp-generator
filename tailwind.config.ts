import type { Config } from "tailwindcss";

// Фирстиль Qmedia: основной — зелёный (#53BD35), акцент — жёлтый (#FFDE00).
// Чёрный почти не используется (только тёмный текст). Цвета сверены с qmedia.by.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#53BD35",
          greenDark: "#3D9A3A",
          greenDeep: "#2F8E2A",
          greenTint: "#E4F4DF",
          greenSoft: "#F5FBF4",
          yellow: "#FFDE00",
          yellowDark: "#E6C800",
          black: "#080808",
          ink: "#151515",
          gray: "#666666",
          mute: "#8D8D8D",
        },
      },
      fontFamily: {
        sans: ["QmediaSans", "Arial", "Helvetica", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        // Зелёный градиент колонтитула/хедера (как в референсном КП).
        "brand-gradient":
          "linear-gradient(100deg, #2F8E2A 0%, #53BD35 55%, #6BC94F 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
