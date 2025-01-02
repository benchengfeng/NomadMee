export const color1 = "#FF6F61";
export const color2 = "#FFA657";
export const color3 = "#FFC857";
export const color4 = "#F9F9E6";
export const color5 = "#4A90E2";
export const color6 = "#58B368";
export const color7 = "#EAEAEA";
export const color8 = "#F7F7F7";


// export const colorW= "#fff"; /* primary white */
// export const colorB= "#111"; /* primary black */
// export const color0= "#333"; /* primary text color */
// export const color00= "#555"; /* primary tag line text color */
// export const color1= "#008C76"; /* Primary Color (teal green) */
// export const color2= "#F4A300"; /* Secondary Color (golden yellow) */
// export const color3= "#FDCB82"; /* Highlight Color (soft yellow) */
// export const color4= "#fcfbfb"; /* Text Color (off white) */
// export const color5= "#005f73"; /* Background Color (deep teal) */
// export const color6= "#0a4d68"; /* Secondary Color (strong navy) */
// export const color7= "#a3b18c"; /* Background Color (sage green) */
// export const color8= "#f1f1f1"; /* Background 2 Color (soft light gray) */


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