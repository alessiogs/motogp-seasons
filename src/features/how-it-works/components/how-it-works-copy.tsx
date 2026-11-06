import Link from 'next/link';

/** Plain-words explanation of every rule the site derives rather than reads from the source. */
export function HowItWorksCopy() {
  return (
    <article className="how-it-works">
      <Link href="/">← All seasons</Link>
      <h1>How it works</h1>
      <p className="muted">
        Race results come from the source as they are. A few things on the site are worked out from those results
        instead; this page explains each of them.
      </p>

      <section aria-labelledby="hiw-participants">
        <h2 id="hiw-participants">Participants</h2>
        <p>
          A Replay opens on the Participants step, before any Session: every Participant on 0 points and no Podium. A
          Participant is any Rider with at least one Result in the Season, even a retirement or a non-start. Real entry
          lists, wildcards and substitutions are not modelled, so a Rider who entered but has no Result does not appear.
        </p>
        <p>
          Participants are listed with the Defending Champion first, then by Season number, then Riders without one by
          name.
        </p>
      </section>

      <section aria-labelledby="hiw-defending">
        <h2 id="hiw-defending">Defending Champion</h2>
        <p>
          The Defending Champion is the World Champion of the previous year in the same Category, even across a change
          of Class: the 2001 500cc champion defends in 2002 MotoGP. The site finds them by replaying that previous Season
          itself.
        </p>
        <p>
          They carry the label until a World Champion is crowned in the Season. There is no label when the previous
          Season is not on the site, or when there is none (as in 1949). If the Defending Champion took no part in the
          Season, the Participants step says so instead.
        </p>
      </section>

      <section aria-labelledby="hiw-numbers">
        <h2 id="hiw-numbers">Season numbers</h2>
        <p>
          A Rider&apos;s Season number is the Bike number they carried in more than half of their Results. A Season
          shows Season numbers only when every Result has a Bike number and every Rider has such a majority number;
          otherwise (in Seasons where numbers changed between Rounds, or are missing from the source) the Standings show
          none.
        </p>
        <p>
          Every Classification shows the Bike number of that very Result when it is known, and marks one that differs
          from the Rider&apos;s Season number. Because it is worked out from the results, a Season number can differ
          from the one a team announced when the source is incomplete.
        </p>
      </section>

      <section aria-labelledby="hiw-colours">
        <h2 id="hiw-colours">Team colours</h2>
        <p>
          <strong>Team colours are approximate.</strong> Each is hand-picked to suggest the Team&apos;s livery that
          Season; none is an official colour. When a Team&apos;s colour is not known, or a Result has no Team, the
          Manufacturer&apos;s colour stands in; when neither is known, the box is a neutral grey. The number is printed
          in black or white, whichever reads better on the colour.
        </p>
        <p>
          In the Standings and on the Podium a Rider shows the colour of their latest Team up to the current Step; on
          the Participants step, the Team they started the Season with; in a Classification, the Team of that Result.
          The same Team spelled in different ways by the source is shown as one Team.
        </p>
      </section>

      <section aria-labelledby="hiw-standings">
        <h2 id="hiw-standings">Standings</h2>
        <p>
          The Standings at every Step use the final official Results of each Session so far. A penalty or
          disqualification decided later is applied to the Session it belongs to, not to the day it was decided.
        </p>
      </section>

      <section aria-labelledby="hiw-windows">
        <h2 id="hiw-windows">Counting windows and Dropped scores</h2>
        <p>
          In some Seasons only a Rider&apos;s best few Round scores counted toward the title. A Counting window is a span
          of Rounds from which only the best N Round scores count (1976 had two: the first five Rounds and the last
          five). The Round scores left out are Dropped scores; what remains are the Championship points, while the
          Gross points column shows everything earned.
        </p>
        <p>
          Scores are dropped only from Rounds already run, so mid-season Standings match the championship as it stood at
          the time, not with end-of-season drops applied early. When two equal Round scores could be dropped, the
          earlier Round is the one dropped.
        </p>
      </section>

      <section aria-labelledby="hiw-ties">
        <h2 id="hiw-ties">Tie-breaks</h2>
        <p>
          Riders level on Championship points are first separated by Countback: most Grand Prix race wins, then most
          second places, and so on. Sprint results do not count.
        </p>
        <p>
          If Countback is still level, the Latest-best tie-break puts ahead the Rider whose highest place came later in
          the Season. So no two Riders ever share a place in the Standings. These are today&apos;s rules, applied to
          every era; older regulations may have worded them differently.
        </p>
      </section>

      <section aria-labelledby="hiw-title">
        <h2 id="hiw-title">Title chance</h2>
        <p>
          A Rider is crowned World Champion at the Step where no rival can catch them any more. A rival who could at
          best tie on points but would lose the tie-break counts as caught.
        </p>
        <p>
          A Rider has a Title chance at a Round when winning every Session of that Round, with nobody else scoring,
          would make them World Champion by its end. It is announced at the Step before the Round starts, and several
          Riders can have one at once. Before any Session where a Rider can be crowned, the Title condition states what
          they need from it, as the margin by which they must outscore each rival still able to catch them. Sessions still to come are counted at full
          points, since Half points are only decided when a Session is stopped.
        </p>
      </section>
    </article>
  );
}
