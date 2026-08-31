/**
 * Continuous red -> green grade gradient, interpolated in HSL space (hue
 * rotation, not RGB blending, so the midtones stay clean rather than
 * muddy). Deliberately a single two-point lerp with no fixed midpoint
 * stop — earlier versions anchored 50% to amber/orange; this one just
 * rotates hue 0 (red) straight through to 130 (green), continuously, so
 * two close grades (89% vs 91%) render as visually close shades instead
 * of jumping color classes.
 */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export type Hsl = { h: number; s: number; l: number };

export function gradeToHsl(grade: number): Hsl {
  const g = Math.max(0, Math.min(100, grade));
  const t = g / 100;
  return {
    h: lerp(0, 130, t),
    s: lerp(75, 65, t),
    l: lerp(50, 45, t),
  };
}

export function hslToString({ h, s, l }: Hsl, alpha?: number): string {
  if (alpha === undefined) return `hsl(${h}, ${s}%, ${l}%)`;
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

export function gradeToColor(grade: number, alpha?: number): string {
  return hslToString(gradeToHsl(grade), alpha);
}

/** Auto-contrast: once the swatch gets dark (lightness below ~48%), flip label text to white. */
export function textColorFor(grade: number): "dark" | "light" {
  return gradeToHsl(grade).l < 48 ? "light" : "dark";
}
