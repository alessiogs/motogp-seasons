/** How a number box is painted: the Team colour behind, black or white text on it. */
export interface BoxColours {
  /** The Team colour ('#rrggbb'), or the neutral grey when it is unknown. */
  background: string;
  /** '#000000' or '#ffffff', whichever contrasts more with the background. */
  foreground: string;
}
