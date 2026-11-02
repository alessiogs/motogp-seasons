import type { CSSProperties } from 'react';

interface Props {
  number: number;
  /** The box colour (Team colour); the neutral grey when omitted. */
  background?: string;
  /** The number's colour, chosen for contrast with the background; white when omitted. */
  foreground?: string;
  /** Shown on hover: "Season number 46", "Bike number 58, not their Season number 46". */
  title: string;
}

/** A Season or Bike number in a parallelogram box, as in broadcast graphics. */
export default function NumBox({ number, background, foreground, title }: Props) {
  const vars: Record<string, string> = {};
  if (background) vars['--box-bg'] = background;
  if (foreground) vars['--box-fg'] = foreground;
  const style = vars as CSSProperties;
  return (
    <span className="num-box" style={style} title={title}>
      {number}
    </span>
  );
}
