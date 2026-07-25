/**
 * @fileoverview Typography font rules from the Stitch design system.
 */
export const typography = {
  fontFamily: {
    sans: ["Inter", "sans-serif"],
  },
  fontSize: {
    "headline-lg-mobile": {
      size: "32px",
      lineHeight: "40px",
      fontWeight: "700",
    },
    "label-md": {
      size: "14px",
      lineHeight: "20px",
      letterSpacing: "0.01em",
      fontWeight: "500",
    },
    "title-lg": {
      size: "24px",
      lineHeight: "32px",
      fontWeight: "600",
    },
    "display-xl": {
      size: "64px",
      lineHeight: "72px",
      letterSpacing: "-0.02em",
      fontWeight: "700",
    },
    "headline-lg": {
      size: "40px",
      lineHeight: "48px",
      letterSpacing: "-0.01em",
      fontWeight: "700",
    },
    "label-sm": {
      size: "12px",
      lineHeight: "16px",
      letterSpacing: "0.05em",
      fontWeight: "600",
    },
    "body-default": {
      size: "16px",
      lineHeight: "24px",
      fontWeight: "400",
    },
    "body-sm": {
      size: "14px",
      lineHeight: "20px",
      fontWeight: "400",
    },
  },
} as const;
