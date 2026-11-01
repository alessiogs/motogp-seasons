import Link from 'next/link';

export const metadata = { title: 'Attribution · MotoGP Seasons' };

export default function AttributionPage() {
  return (
    <>
      <Link href="/">← All seasons</Link>
      <h1>Attribution</h1>
      <p>
        The race results shown on this site are loaded from{' '}
        <a href="https://en.wikipedia.org/">Wikipedia</a>, the free encyclopedia, and its contributors. Wikipedia text is
        available under the{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 licence (CC BY-SA 4.0)</a>.
      </p>
      <p>
        The data published here is derived from that material, so it is released under the same CC BY-SA 4.0 licence:
        you may share and adapt it, provided you credit Wikipedia and its contributors, indicate changes, and license your
        version under the same terms. Each result records the Wikipedia article it came from.
      </p>
      <p className="muted">
        Results are checked by hand against the official motogp.com records, which are never copied into the data. This
        site is not affiliated with MotoGP, Dorna or the FIM.
      </p>
    </>
  );
}
