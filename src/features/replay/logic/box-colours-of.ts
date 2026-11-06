import type { BoxColours } from '../types/box-colours';

/** The neutral grey of a box whose Team colour is unknown; matches --neutral-box in globals.css. */
const NEUTRAL = '#5a606c';

/**
 * The box colours for a Team colour ('#rrggbb', or null when unknown): the colour itself, or the neutral grey,
 * with black or white text, whichever has the higher WCAG contrast ratio against it.
 */
export function boxColoursOf(teamColour: string | null | undefined): BoxColours {
  const background = teamColour ?? NEUTRAL;
  const l = luminance(background);
  // Contrast with black is (l + 0.05) / 0.05, with white 1.05 / (l + 0.05): black wins when the first is larger.
  const blackText = (l + 0.05) * (l + 0.05) > 1.05 * 0.05;
  return { background, foreground: blackText ? '#000000' : '#ffffff' };
}

/** WCAG relative luminance of a '#rrggbb' colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
