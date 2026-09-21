import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFFF2",
          100: "#FAF8D4",
          200: "#EFEAC0",
          300: "#E5DEAA",
        },
        retroRed: {
          500: "#FF3B30",
          600: "#CC0000",
          700: "#990000",
          800: "#660000",
        },
        retroWin: {
          gray: "#D4D0C8",
          dark: "#404040",
          border: "#808080",
          tab: "#808098",
          tabActive: "#BFBF97",
          tabInactive: "#4B4B6E",
        }
      },
      boxShadow: {
        'brutal': '3px 3px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'brutal-lg': '5px 5px 0px #000000',
        'retro-inset': 'inset 2px 2px 0px #808080, inset -2px -2px 0px #FFFFFF',
        'retro-outset': 'inset 2px 2px 0px #FFFFFF, inset -2px -2px 0px #808080',
      },
      fontFamily: {
        serif: ["Songti SC", "SimSun", "Times New Roman", "serif"],
        display: ["Impact", "Arial Black", "sans-serif"],
      }
    },
  },
  plugins: [],
};

export default config;
