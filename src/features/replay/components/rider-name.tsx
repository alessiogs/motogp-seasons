import type { RiderInfo } from '../types/rider-info';

/** A Rider's full name, swapped for the TV-style short name ("F BAG") on narrow screens; screen readers get the full name. */
export default function RiderName({ rider, fallback }: { rider: RiderInfo | undefined; fallback: string }) {
  return (
    <span className="rider-name">
      <span className="name-full">{rider?.name ?? fallback}</span>
      <span className="name-short" aria-hidden="true">
        {rider?.shortName ?? fallback}
      </span>
    </span>
  );
}
