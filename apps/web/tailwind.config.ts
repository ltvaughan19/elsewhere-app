import type { Config } from "tailwindcss";
import preset from "@expat-atlas/config/tailwind";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [preset],
};

export default config;
