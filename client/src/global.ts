export const color1 = "#FF6F61";
export const color2 = "#FFA657";
export const color3 = "#FFC857";
export const color4 = "#F9F9E6";
export const color5 = "#4A90E2";
export const color6 = "#58B368";
export const color7 = "#EAEAEA";
export const color8 = "#F7F7F7";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

declare global {
    interface Window {
      gtag: (
        command: "config" | "event" | "js",
        targetId: string,
        config?: Record<string, any>
      ) => void;
    }
  }