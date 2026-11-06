# MotoGP Seasons

Replaying Grand Prix motorcycle World Championship seasons step by step, showing how the riders' standings evolved after every points-paying session.

## Championship structure

**World Championship**:
The FIM Grand Prix motorcycle racing series for solo motorcycles as a whole, since 1949. Sidecars and MotoE are not part of it here.
_Avoid_: MotoGP (when meaning the whole series)

**Category**:
A lineage of Classes that succeeded one another as the same tier of the World Championship, linking them for statistics across the lineage. Every Class belongs to exactly one Category: Premier (500cc, MotoGP), Intermediate (250cc, Moto2), Lightweight (125cc, Moto3), 350cc (350cc) and Smallest (50cc, 80cc).
_Avoid_: Class group, series, tier, middle class, light class

**Class**:
One engine formula within the World Championship, such as 500cc, MotoGP or 250cc. MotoGP is the Class that replaced 500cc in 2002.
_Avoid_: Category

**Season**:
One year of one Class.

**Round**:
A numbered Grand Prix weekend within a Season.
_Avoid_: Race, event, GP

**Non-championship round**:
A Round on the Class's calendar whose Grand Prix race was excluded from the championship or cancelled, so it awards no points. It keeps its Round number. A weekend with no race for the Class at all is not a Round.

**Session**:
A contest within a Round that awards championship points: the Grand Prix race and, since 2023, the Sprint.
_Avoid_: Race

**Grand Prix race**:
The main Session of a Round.
_Avoid_: Race, main race

**Sprint**:
The shorter Session held the day before the Grand Prix race, since 2023.

## Riders and results

**Rider**:
One real person, the same across every Class and Season, whatever spelling a source uses for their name.

**Nationality**:
The flag a Rider raced under in a given Season, which may be a country that no longer exists.

**Result**:
One Rider's outcome in one Session.

**Team**:
The outfit a Rider entered a Result with, as one identity within a Season however a source spells its name. Early Results often have none.
_Avoid_: Squad, entrant

**Manufacturer**:
The maker of the motorcycle in a Result, such as Norton, Honda or Ducati.
_Avoid_: Constructor, brand, make

**Team colour**:
The colour that stands for a Team in a Season, approximating its livery; when unknown, the Manufacturer's colour stands in.
_Avoid_: Livery

**Bike number**:
The number a Rider carried in one Result. It can change between Rounds, and early sources often don't record it.
_Avoid_: Race number, plate

**Season number**:
The Bike number a Rider carried in more than half of their Results in a Season. A Season has Season numbers only when every Result has a Bike number and every Rider has one; a Result carrying a different number is an exception to it.
_Avoid_: Permanent number, fixed number

**Participant**:
A Rider with at least one Result in a Season. Real entry lists, wildcards and substitutions are not modelled.
_Avoid_: Entrant, entry list, grid

**Defending Champion**:
The World Champion of the previous Season in the same Category, so the 2001 500cc champion defends in 2002 MotoGP. A Season can have none, as in 1949. They hold the label until a World Champion is crowned in this Season.
_Avoid_: Reigning champion, title holder

**Classified**:
A Result with a finishing position; only Classified Results earn position points.

**Outcome**:
How a Result ended: Finished, Did not finish, Did not start, Disqualified, or Not classified (finished but completed too few laps).
_Avoid_: Status

**Classification**:
The full ordered list of Results of one Session; its top three are the Podium.
_Avoid_: Results table, race order

**Aggregate classification**:
The official result of a Session run in two parts, combining both parts; it is the only Result recorded for that Session.

## Scoring

**Scoring rule**:
The points system a Season uses: points per position for each Session, Counting windows, and any Fastest-lap bonus.

**Fastest-lap bonus**:
Extra points for the Rider who set the fastest lap of a Session, used only in 1949 and only for finishers.

**Half points**:
A Session that awards half the usual points, typically because it was stopped early.

**Points override**:
Points given to a single Result by official decision instead of by the Scoring rule, such as a penalty.

**Round score**:
The points a Rider earned across all Sessions of one Round.

**Counting window**:
A span of Rounds from which only a Rider's best N Round scores count toward the championship. Most Seasons with dropped scores have one window; 1976 had two.
_Avoid_: Best-N (as a noun)

**Dropped score**:
A Round score left out because it fell outside a Rider's best N in its Counting window.

**Gross points**:
All points a Rider has earned, before Dropped scores are removed.

**Championship points**:
The points that count toward the title, after Dropped scores are removed.

## Standings and replay

**Standings**:
Riders ranked by Championship points at a given Step, built from the final official Results of every Session up to that Step.
_Avoid_: Leaderboard, table

**Countback**:
The tie-break on equal Championship points: most Grand Prix race wins, then most second places, and so on, over every Grand Prix race finish, Dropped scores included. Sprint results do not count.

**Latest-best tie-break**:
The last tie-break after Countback: the Rider whose highest place came later in the Season ranks ahead.

**Title chance**:
A Rider has a Title chance at a Round when some combination of results would make them World Champion by the end of that Round. It is announced at the Step before the Round starts, and several Riders can have one at once.
_Avoid_: Match point, clinch opportunity

**Title condition**:
What a Rider with a Title chance needs from the next Step to be crowned there, stated as the margin by which they must outscore each rival still able to catch them.

**World Champion**:
The Rider whom no rival can catch any more, where a rival who could at best tie on Championship points but would lose the Season's tie-break counts as caught. They are crowned at the Step where that becomes true, and stay World Champion for the rest of the Replay.
_Avoid_: Clinched, title winner

**Replay**:
Stepping through a Season to watch the Standings evolve.

**Step**:
One position in the Replay: the Participants step, then the Standings right after each Session. Since 2023 a Round has two Steps, the Sprint and then the Grand Prix race.

**Participants step**:
The first Step of a Replay, before any Session: every Participant on 0 points, with no Podium.
_Avoid_: Step 0, entry list
