/**
 * @fileoverview Motion and transition design tokens (Framer Motion definitions).
 */
export const motion = {
  transition: {
    default: { type: "spring", stiffness: 300, damping: 30 },
    gentle: { type: "spring", stiffness: 120, damping: 14 },
    slow: { type: "tween", ease: "easeInOut", duration: 0.6 },
    fast: { type: "tween", ease: "easeOut", duration: 0.2 },
  },
  animations: {
    float: {
      animate: { translateY: [0, -10, 0] },
      transition: { duration: 6, ease: "easeInOut", repeat: Infinity },
    },
    pulse: {
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 2, ease: "easeInOut", repeat: Infinity },
    },
  },
} as const;
