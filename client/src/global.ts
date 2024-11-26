export const color1 = "#ff5533";
export const color2 = "#ff9538";
export const color3 = "#ffd952";
export const color4 = "#ffffbd";
export const color5 = "#003e80";
export const color6 = "#80cc28";
export const color7 = "#f5f5f5";
export const color8 = "#f8f8f8";

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