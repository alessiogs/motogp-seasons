import { flagOf } from '../logic/flag';

/** A Nationality flag: emoji where one exists, otherwise a small code badge (countries that no longer exist). */
export default function FlagBadge({ code }: { code: string | null }) {
  const flag = flagOf(code);
  if (!flag) return null;
  return flag.emoji ? (
    <span className="flag" role="img" aria-label={flag.name} title={flag.name}>
      {flag.emoji}
    </span>
  ) : (
    <span className="flag flag-code" title={flag.name}>
      {flag.code}
    </span>
  );
}
