import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Boss Beauty Studio
        bg:          "#D4CDC8", // background principal
        surface:     "#EFEAE7", // cards, panels
        "surface-alt": "#E8E3DF", // hover, séparateurs
        border:      "#D9D4D0", // bordures subtiles
        accent:      "#111111", // boutons primaires, focus
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm:  "8px",
        DEFAULT: "12px",
        lg:  "16px",
      },
    },
  },
  plugins: [],
};

export default config;
