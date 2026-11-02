import type { CSSProperties } from 'react';
import type { BoxColours } from '../types/box-colours';

interface Props {
  number: number;
  /** The box's Team colour and contrasting text colour. */
  box: BoxColours;
  /** Shown on hover: "Season number 46", "Bike number 58, not their Season number 46". */
  title: string;
}

/** A Season or Bike number in a parallelogram box, as in broadcast graphics. */
export default function NumberBox({ number, box, title }: Props) {
  const style = { '--box-bg': box.background, '--box-fg': box.foreground } as CSSProperties;
  return (
    <span className="number-box" style={style} title={title}>
      {number}
    </span>
  );
}
