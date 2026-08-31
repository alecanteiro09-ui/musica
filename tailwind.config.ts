import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#FBF7FA", // fundo principal — papel claro, sombra de lavanda
          soft: "#FFFFFF",     // fundo de cards — branco puro, "levanta" sobre o papel
          border: "#EBE0E8",
        },
        ink: {
          DEFAULT: "#332A3D", // ameixa escura — mais suave que preto puro
          muted: "#8B7D93",   // lavanda-acinzentado, texto secundário
        },
        accent: {
          DEFAULT: "#FF7A54", // coral quente — CTA, energia da voz cantada
          dim: "#E85C36",
          soft: "#FFE6DB",
        },
        wax: {
          DEFAULT: "#E3A73D", // âmbar "selo de carta" — badges de presente/preço
          dim: "#C48A28",
        },
        success: "#2F9E6E",
        "on-accent": "#2B1810", // cor de texto sobre fundo accent (contraste em claro e escuro)
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
