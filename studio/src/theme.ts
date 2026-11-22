import { loadFont as loadBaloo2 } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";

const baloo = loadBaloo2("normal", { weights: ["700", "800"], subsets: ["latin"] });
const fredoka = loadFredoka("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });

export const FONT_DISPLAY = baloo.fontFamily;
export const FONT_UI = fredoka.fontFamily;

export const PALETTE = {
  outline: "#3D261C",
  outlineSoft: "#593A2B",
  skyTop: "#2EB2FF",
  skyMid: "#7CD8FF",
  skyBottom: "#E2F7FF",
  sunGold: "#FFD43B",
  sunWarm: "#FFA927",
  coral: "#FF4D6D",
  meadowLight: "#6CE88F",
  meadowMain: "#2ED573",
  meadowDeep: "#1EB55D",
  cream: "#FFFDF7",
  rainbow: ["#FF4757", "#FF9F43", "#FFD32A", "#2ED573", "#1E90FF", "#9B59B6"],
} as const;
