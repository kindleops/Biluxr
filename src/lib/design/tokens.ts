/**
 * JavaScript mirror of the motion and layering tokens defined in
 * `src/app/globals.css`. CSS remains the source of truth; a unit test asserts
 * these values stay in sync.
 */
export const duration = {
  instant: 90,
  quick: 160,
  base: 240,
  slow: 520,
  deliberate: 900,
} as const;

export const easing = {
  considered: "cubic-bezier(0.22, 0.61, 0.24, 1)",
  settle: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.4, 0, 0.9, 0.6)",
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 30,
  nav: 40,
  overlay: 60,
  sheet: 70,
  toast: 80,
  banner: 90,
} as const;

export const radius = {
  hair: 2,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  card: 18,
  sheet: 28,
} as const;

export const color = {
  ink950: "#08080a",
  ink900: "#0d0d10",
  ink800: "#17171b",
  bone100: "#f3efe8",
  bone400: "#a29c91",
  paper100: "#f4f1eb",
  sable400: "#c2ab82",
} as const;
