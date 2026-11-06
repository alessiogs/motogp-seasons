# Premier-class Scoring rules, 1949–2025

Research for [ADR-0003](../adr/0003-scoring-is-data.md): the Scoring rule of every Premier-category Season (500cc 1949–2001, MotoGP 2002–2025). Terms are those of [GLOSSARY.md](../../GLOSSARY.md). Researched 2026-11-06.

## How this was checked, and how far to trust it

- **Sources reached.** motogp.com and fim-moto.com were out of reach, and so were web.archive.org copies of motogp.com. Almost every claim therefore rests on English Wikipedia season articles. For the scoring sentences those articles cite *Motocourse: 50 Years of Moto Grand Prix* (Noyes & Scott, 1999), the *Guinness Motorcycle Sport Fact Book* (Morrison, 1991, p. 14) or Haefliger's *FIM MotoGP Results 1949–2023 Guide*, but none of those books could be opened here. The independent sources reached were [Yamaha Motor's WGP-50th race archive](https://global.yamaha-motor.com/race/wgp-50th/race_archive/season1990_99/1991/index.html) (a manufacturer, giving gross and net totals for 1974, 1975, 1991 and 1992), [speedweek.com](https://speedweek.com/motogp500/wmstand/560/1991.html), [crash.net](https://www.crash.net/motogp/results/1086801/1/valencia-final-2025-motogp-world-championship-standings) and [nick-harris.co.uk](https://www.nick-harris.co.uk/?p=2028) (Martin Raines). Other-language Wikipedias were not consulted. Wikipedia on its own is a weak source, and that is what most rows rest on.
- **Source ranking used**, closest to the FIM first: (1) FIM/motogp.com, not reachable; (2) Motocourse, Guinness and Haefliger, seen only as Wikipedia citations; (3) the Yamaha archive and contemporary press; (4) Wikipedia tables and prose.
- **Arithmetic (the check that counts).** For every Season the final Wikipedia standings were taken: per-Round cells for the top 3 or 4 Riders and the printed points total, including the bracketed gross where the table prints one. The candidate rule was then replayed in python3. Unless a row says otherwise, every Rider checked reproduces the printed total exactly. **Binding** means a checked Rider had more scoring Rounds than the rule counts, so the arithmetic proves N. **Non-binding** means no checked Rider scored in more than N Rounds, so only a lower bound on N is proved.
- **Confidence labels.** `verified` means arithmetic matches and, where Rounds are dropped, a binding case exists. `verified (non-binding)` means arithmetic matches but the exact N rests on the source text. `sourced` means the rule is cited but there was no arithmetic. `unconfirmed` means neither.

## Named points tables

| Code | Positions → points | Seasons |
|---|---|---|
| **T49** | 10-8-7-6-5 (top 5) | 1949 |
| **T50** | 8-6-4-3-2-1 (top 6) | 1950–1968 |
| **T69** | 15-12-10-8-6-5-4-3-2-1 (top 10) | 1969–1987 |
| **T88** | 20-17-15-13-11-10-9-8-7-6-5-4-3-2-1 (top 15) | 1988–1991 |
| **T92** | 20-15-12-10-8-6-4-3-2-1 (top 10) | 1992 |
| **T93** | 25-20-16-13-11-10-9-8-7-6-5-4-3-2-1 (top 15) | 1993–2025 (Grand Prix race) |
| **S23** | Sprint 12-9-7-6-5-4-3-2-1 (top 9) | 2023–2025 (Sprint) |

Sources: [List of FIM World Championship points scoring systems](https://en.wikipedia.org/wiki/List_of_FIM_World_Championship_points_scoring_systems), which cites motogp.com, *Motocourse 1976–77* pp. 33, 185 and Guinness p. 14. Each Season article below gives the same table. The Fastest-lap bonus is 1 point, 1949 only, and goes only to a Rider who finished ([List](https://en.wikipedia.org/wiki/List_of_FIM_World_Championship_points_scoring_systems); [data/scoring-rules/1949.json](../../data/scoring-rules/1949.json)). From the 1980s the articles state that a Rider must finish to score (e.g. [1980](https://en.wikipedia.org/wiki/1980_Grand_Prix_motorcycle_racing_season), [1988](https://en.wikipedia.org/wiki/1988_Grand_Prix_motorcycle_racing_season)), which matches the glossary's "only Classified Results earn position points". No Season has a different finish requirement.

## 1. Summary table (77 Seasons)

R = Rounds that scored for this Class. "Best N" means one Counting window spanning every Round. Wp = the English Wikipedia Season article. FL = Fastest-lap bonus, which applies only in 1949 (finish required). Only the Grand Prix race scores until 2022; from 2023 the Sprint scores too. Rows show these only where they differ.

| Season | R | Table | Counting windows | FL | Sessions | Half points / stopped / excluded | Confidence (arithmetic) | Sources |
|---|---|---|---|---|---|---|---|---|
| 1949 | 6 | T49 | best 3 | 1 pt, finisher | GP | — | verified (existing rule file) | [1949.json](../../data/scoring-rules/1949.json), [wp](https://en.wikipedia.org/wiki/1949_Grand_Prix_motorcycle_racing_season) |
| 1950 | 6 | T50 | best 4 | — | GP | — | verified: Masetti gross 29 → 28 | [wp](https://en.wikipedia.org/wiki/1950_Grand_Prix_motorcycle_racing_season) |
| 1951 | 8 | T50 | best 5 | — | GP | — | verified: Duke 37 → 35 | [wp](https://en.wikipedia.org/wiki/1951_Grand_Prix_motorcycle_racing_season) |
| 1952 | 8 | T50 | best 5 | — | GP | — | verified (non-binding, N≥5) | [wp](https://en.wikipedia.org/wiki/1952_Grand_Prix_motorcycle_racing_season) |
| 1953 | 8 | T50 | best 5 | — | GP | German GP 500cc race excluded (counted only as a national event) | verified: Armstrong 30 → 24 | [wp](https://en.wikipedia.org/wiki/1953_Grand_Prix_motorcycle_racing_season) |
| 1954 | 8 | T50 | best 5 | — | GP | Ulster 500cc race excluded (shortened by rain) | verified: Duke 46 → 40 | [wp](https://en.wikipedia.org/wiki/1954_Grand_Prix_motorcycle_racing_season), [List fn.](https://en.wikipedia.org/wiki/List_of_FIM_World_Championship_points_scoring_systems) |
| 1955 | 8 | T50 | best 5 | — | GP | — | verified (non-binding, N≥5) | [wp](https://en.wikipedia.org/wiki/1955_Grand_Prix_motorcycle_racing_season) |
| 1956 | 6 | T50 | best 4 | — | GP | — | verified (non-binding, N≥4) | [wp](https://en.wikipedia.org/wiki/1956_Grand_Prix_motorcycle_racing_season) |
| 1957 | 6 | T50 | best 4 | — | GP | — | verified: Liberati 38 → 32 | [wp](https://en.wikipedia.org/wiki/1957_Grand_Prix_motorcycle_racing_season) |
| 1958 | 7 | T50 | best 4 | — | GP | — | verified: Surtees 48 → 32, Dale 16 → 13 | [wp](https://en.wikipedia.org/wiki/1958_Grand_Prix_motorcycle_racing_season) |
| 1959 | 7 | T50 | best 4 | — | GP | Swedish GP 500cc race did not count | verified: Surtees 56 → 32, Venturi 24 → 22, Brown 22 → 17 | [wp](https://en.wikipedia.org/wiki/1959_Grand_Prix_motorcycle_racing_season) |
| 1960 | 7 | T50 | best 4 | — | GP | — | verified: Surtees 46 → 32 | [wp](https://en.wikipedia.org/wiki/1960_Grand_Prix_motorcycle_racing_season) |
| 1961 | 10 | T50 | best 6 | — | GP | no 500cc race at the Spanish GP | verified: Hocking 56 → 48, Hailwood 55 → 40 | [wp](https://en.wikipedia.org/wiki/1961_Grand_Prix_motorcycle_racing_season) |
| 1962 | 8 | T50 | best 5 | — | GP | — | verified (non-binding, N≥5) | [wp](https://en.wikipedia.org/wiki/1962_Grand_Prix_motorcycle_racing_season) |
| 1963 | 8 | T50 | best 5 | — | GP | — | verified: Hailwood 56 → 40 | [wp](https://en.wikipedia.org/wiki/1963_Grand_Prix_motorcycle_racing_season) |
| 1964 | 9 | T50 | best 5 | — | GP | — | verified: Hailwood 56 → 40, Ahearn 29 → 25 | [wp](https://en.wikipedia.org/wiki/1964_Grand_Prix_motorcycle_racing_season) |
| 1965 | 10 | T50 | best 6 | — | GP | — | verified: Hailwood 64 → 48, Agostini 44 → 38 | [wp](https://en.wikipedia.org/wiki/1965_Grand_Prix_motorcycle_racing_season) |
| 1966 | 9 | T50 | best 5 | — | GP | — | verified: Agostini 54 → 36, Findlay 21 → 20 | [wp](https://en.wikipedia.org/wiki/1966_Grand_Prix_motorcycle_racing_season) |
| 1967 | 10 | T50 | best 6 | — | GP | tie for the title, see §4 | verified: Agostini 58 → 46, Hailwood 52 → 46 | [wp](https://en.wikipedia.org/wiki/1967_Grand_Prix_motorcycle_racing_season), [Raines](https://www.nick-harris.co.uk/?p=2028) |
| 1968 | 10 | T50 | best 6 | — | GP | — | verified: Agostini 80 → 48, Findlay 36 → 34 | [wp](https://en.wikipedia.org/wiki/1968_Grand_Prix_motorcycle_racing_season) |
| 1969 | 12 | T69 | best 7 | — | GP | — | verified: Agostini 150 → 105 | [wp](https://en.wikipedia.org/wiki/1969_Grand_Prix_motorcycle_racing_season) |
| 1970 | 11 | T69 | best 6 | — | GP | no 500cc race at the Czechoslovak GP | verified: Agostini 150 → 90, Molloy 71 → 62 | [wp](https://en.wikipedia.org/wiki/1970_Grand_Prix_motorcycle_racing_season) |
| 1971 | 11 | T69 | best 6 | — | GP | no 500cc race at the Czechoslovak GP | verified: Agostini 120 → 90, Turner 67 → 58 | [wp](https://en.wikipedia.org/wiki/1971_Grand_Prix_motorcycle_racing_season) |
| 1972 | 13 | T69 | best 7 | — | GP | Isle of Man dead heat for 8th, see §3 | verified: Agostini 165 → 105, Kneubühler 57 → 54 | [wp](https://en.wikipedia.org/wiki/1972_Grand_Prix_motorcycle_racing_season) |
| 1973 | 11 | T69 | best 6 | — | GP | Nations GP 500cc race cancelled; Sanby excluded, see §3 | verified: Read 108 → 84, Newcombe 69 → 63, Giger 48 → 44 | [wp](https://en.wikipedia.org/wiki/1973_Grand_Prix_motorcycle_racing_season) |
| 1974 | 10 | T69 | best 6 | — | GP | no 500cc race in Yugoslavia or Spain | verified: Read 92 → 82, Bonera 78 → 69 | [wp](https://en.wikipedia.org/wiki/1974_Grand_Prix_motorcycle_racing_season), [Yamaha](https://global.yamaha-motor.com/race/wgp-50th/race_archive/season1970_79/1974/) |
| 1975 | 10 | T69 | best 6 | — | GP | no 500cc race in Spain or Yugoslavia | verified: Read 96 → 76 | [wp](https://en.wikipedia.org/wiki/1975_Grand_Prix_motorcycle_racing_season), [Yamaha](https://global.yamaha-motor.com/race/wgp-50th/race_archive/season1970_79/1975/) |
| 1976 | 10 | T69 | best 3 of R1–5 + best 3 of R6–10 | — | GP | Länsivuori DSQ in Austria | verified: Länsivuori 48 (plain best-6 would give 54) | [wp](https://en.wikipedia.org/wiki/1976_Grand_Prix_motorcycle_racing_season), [1976.json](../../data/scoring-rules/1976.json) |
| 1977 | 11 | T69 | all | — | GP | Austria raced by a reduced field after a riders' strike | verified: Baker scores in 9 Rounds, all count | [wp](https://en.wikipedia.org/wiki/1977_Grand_Prix_motorcycle_racing_season) |
| 1978 | 11 | T69 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1978_Grand_Prix_motorcycle_racing_season) |
| 1979 | 12 | T69 | all | — | GP | Belgian GP boycotted by top riders (still counted) | verified | [wp](https://en.wikipedia.org/wiki/1979_Grand_Prix_motorcycle_racing_season) |
| 1980 | 8 | T69 | all | — | GP | no 500cc race in Yugoslavia or Czechoslovakia; Austria cancelled (snow) | verified | [wp](https://en.wikipedia.org/wiki/1980_Grand_Prix_motorcycle_racing_season) |
| 1981 | 11 | T69 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1981_Grand_Prix_motorcycle_racing_season) |
| 1982 | 12 | T69 | all | — | GP | French GP (Nogaro) boycotted by factory riders (still counted); tie for 4th, see §4 | verified | [wp](https://en.wikipedia.org/wiki/1982_Grand_Prix_motorcycle_racing_season) |
| 1983 | 12 | T69 | all | — | GP | British GP decided by Aggregate classification over two parts | verified for Spencer, Roberts, Lawson; Mamola sums to 90 against 89 printed, see §5 | [wp](https://en.wikipedia.org/wiki/1983_Grand_Prix_motorcycle_racing_season) |
| 1984 | 12 | T69 | all | — | GP | — | verified: Lawson, Roche | [wp](https://en.wikipedia.org/wiki/1984_Grand_Prix_motorcycle_racing_season) |
| 1985 | 12 | T69 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1985_Grand_Prix_motorcycle_racing_season) |
| 1986 | 11 | T69 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1986_Grand_Prix_motorcycle_racing_season) |
| 1987 | 15 | T69 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1987_Grand_Prix_motorcycle_racing_season) |
| 1988 | 15 | T88 | all | — | GP | — | verified: Lawson, Gardner, Rainey, Sarron, Magee each with up to 15 scores, all count | [wp](https://en.wikipedia.org/wiki/1988_Grand_Prix_motorcycle_racing_season) |
| 1989 | 15 | T88 | all | — | GP | **Belgian GP (R10) half points** | verified: Lawson 228, Rainey 210.5, Sarron 165.5 | [wp](https://en.wikipedia.org/wiki/1989_Grand_Prix_motorcycle_racing_season), [1988-91.json](../../data/scoring-rules/1988-91.json) |
| 1990 | 15 | T88 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1990_Grand_Prix_motorcycle_racing_season) |
| 1991 | 15 | T88 | **best 13** | — | GP | tie for 4th, see §4 | verified: Rainey 240 → 233, Doohan 239 → 224 | [wp](https://en.wikipedia.org/wiki/1991_Grand_Prix_motorcycle_racing_season), [Yamaha](https://global.yamaha-motor.com/race/wgp-50th/race_archive/season1990_99/1991/index.html), [speedweek](https://speedweek.com/motogp500/wmstand/560/1991.html) |
| 1992 | 13 | T92 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1992_Grand_Prix_motorcycle_racing_season), [Yamaha](https://global.yamaha-motor.com/race/wgp-50th/race_archive/season1990_99/1992/) |
| 1993 | 14 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1993_Grand_Prix_motorcycle_racing_season) |
| 1994 | 14 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1994_Grand_Prix_motorcycle_racing_season) |
| 1995 | 13 | T93 | all | — | GP | (half points only in 125cc) | verified | [wp](https://en.wikipedia.org/wiki/1995_Grand_Prix_motorcycle_racing_season) |
| 1996 | 15 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1996_Grand_Prix_motorcycle_racing_season) |
| 1997 | 15 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1997_Grand_Prix_motorcycle_racing_season) |
| 1998 | 14 | T93 | all | — | GP | Biaggi DSQ in Catalonia | verified | [wp](https://en.wikipedia.org/wiki/1998_Grand_Prix_motorcycle_racing_season) |
| 1999 | 16 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/1999_Grand_Prix_motorcycle_racing_season) |
| 2000 | 16 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2000_Grand_Prix_motorcycle_racing_season) |
| 2001 | 16 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2001_Grand_Prix_motorcycle_racing_season) |
| 2002 | 16 | T93 | all | — | GP | Biaggi DSQ at R3 | verified | [wp](https://en.wikipedia.org/wiki/2002_Grand_Prix_motorcycle_racing_season) |
| 2003 | 16 | T93 | all | — | GP | Rossi 10 s penalty at Phillip Island (still won) | verified | [wp](https://en.wikipedia.org/wiki/2003_Grand_Prix_motorcycle_racing_season) |
| 2004 | 16 | T93 | all | — | GP | Italian GP stopped by rain and re-run as a 6-lap race that set the result | verified | [wp](https://en.wikipedia.org/wiki/2004_Grand_Prix_motorcycle_racing_season) |
| 2005 | 17 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2005_Grand_Prix_motorcycle_racing_season) |
| 2006 | 17 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2006_Grand_Prix_motorcycle_racing_season) |
| 2007 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2007_Grand_Prix_motorcycle_racing_season) |
| 2008 | 18 | T93 | all | — | GP | Indianapolis stopped early (wind): **full points** | verified: Rossi 373 needs 25 for Indianapolis | [wp](https://en.wikipedia.org/wiki/2008_Grand_Prix_motorcycle_racing_season) |
| 2009 | 17 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2009_Grand_Prix_motorcycle_racing_season) |
| 2010 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2010_Grand_Prix_motorcycle_racing_season) |
| 2011 | 18 (17 run) | T93 | all | — | GP | **Malaysia (R17) cancelled** after the lap-2 red flag: no points | verified: Stoner, Dovizioso (Lorenzo's row incomplete) | [wp](https://en.wikipedia.org/wiki/2011_Grand_Prix_motorcycle_racing_season) |
| 2012 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2012_MotoGP_World_Championship) |
| 2013 | 18 | T93 | all | — | GP | Márquez DSQ in Australia; Aragón deduction applied to constructors only | verified | [wp](https://en.wikipedia.org/wiki/2013_MotoGP_World_Championship) |
| 2014 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2014_MotoGP_World_Championship) |
| 2015 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2015_MotoGP_World_Championship) |
| 2016 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2016_MotoGP_World_Championship) |
| 2017 | 18 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2017_MotoGP_World_Championship) |
| 2018 | 19 (18 run) | T93 | all | — | GP | **British GP (R12) cancelled** (rain) | verified | [wp](https://en.wikipedia.org/wiki/2018_MotoGP_World_Championship) |
| 2019 | 19 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2019_MotoGP_World_Championship) |
| 2020 | 14 | T93 | all | — | GP | Yamaha penalties applied to team/manufacturer only | verified | [wp](https://en.wikipedia.org/wiki/2020_MotoGP_World_Championship) |
| 2021 | 18 | T93 | all | — | GP | red flags at Styria and Algarve | verified | [wp](https://en.wikipedia.org/wiki/2021_MotoGP_World_Championship) |
| 2022 | 20 | T93 | all | — | GP | — | verified | [wp](https://en.wikipedia.org/wiki/2022_MotoGP_World_Championship) |
| 2023 | 20 | T93 + S23 | all | — | Sprint + GP | **Australian Sprint cancelled** (19 Sprints); Japan GP stopped after 13 of 24 laps: **full points** | verified: Bagnaia 327+140 = 467, Martín 260+168 = 428, Bezzecchi 242+87 = 329 | [wp](https://en.wikipedia.org/wiki/2023_MotoGP_World_Championship) |
| 2024 | 20 | T93 + S23 | all | — | Sprint + GP | Valencia replaced by the Barcelona "Solidarity GP" | verified: Martín 337+171 = 508, Bagnaia 370+128 = 498, Márquez 270+122 = 392 | [wp](https://en.wikipedia.org/wiki/2024_MotoGP_World_Championship), [2023-plus.json](../../data/scoring-rules/2023-plus.json) |
| 2025 | 22 | T93 + S23 | all | — | Sprint + GP | none reported | **sourced** (totals only: M. Márquez 545, A. Márquez 467, Bezzecchi 353) | [wp mirror (2026-03 dump)](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/2025_MotoGP_season), [crash.net](https://www.crash.net/motogp/results/1086801/1/valencia-final-2025-motogp-world-championship-standings) |

## 2. Eras (one Scoring rule file each)

An era here means consecutive Seasons with the same points tables, the same Counting-window shape **and count**, and the same bonus. Because a Counting window carries explicit `fromRound`/`toRound`, a dropped-score rule only transfers between Seasons with the same Round count. That holds for every era below that has dropped scores.

| # | Seasons | Table | Windows | Note |
|---|---|---|---|---|
| 1 | 1949 | T49 + FL 1 (finisher) | best 3 of R1–6 | exists: `1949.json` |
| 2 | 1950 | T50 | best 4 of R1–6 | |
| 3 | 1951–1955 | T50 | best 5 of R1–8 | 1953 and 1954 each had a 9th, excluded 500cc race, see §3 |
| 4 | 1956–1957 | T50 | best 4 of R1–6 | identical to era 2 |
| 5 | 1958–1960 | T50 | best 4 of R1–7 | 1959 had an 8th, non-championship 500cc race |
| 6 | 1961 | T50 | best 6 of R1–10 | |
| 7 | 1962–1963 | T50 | best 5 of R1–8 | identical to era 3 |
| 8 | 1964 | T50 | best 5 of R1–9 | |
| 9 | 1965 | T50 | best 6 of R1–10 | identical to era 6 |
| 10 | 1966 | T50 | best 5 of R1–9 | identical to era 8 |
| 11 | 1967–1968 | T50 | best 6 of R1–10 | identical to eras 6 and 9 |
| 12 | 1969 | T69 | best 7 of R1–12 | |
| 13 | 1970–1971 | T69 | best 6 of R1–11 | |
| 14 | 1972 | T69 | best 7 of R1–13 | |
| 15 | 1973 | T69 | best 6 of R1–11 | identical to era 13 if the cancelled Nations GP is not a Round |
| 16 | 1974–1975 | T69 | best 6 of R1–10 | |
| 17 | 1976 | T69 | best 3 of R1–5 + best 3 of R6–10 | exists: `1976.json` |
| 18 | 1977–1987 | T69 | all | |
| 19 | 1988–1990 | T88 | all | `1988-91.json` is currently claimed for 1989 only. It is correct for 1988 and 1990, and **wrong for 1991** |
| 20 | 1991 | T88 | best 13 of R1–15 | "a one-year quirk" ([wp 1991](https://en.wikipedia.org/wiki/1991_Grand_Prix_motorcycle_racing_season), citing Motocourse) |
| 21 | 1992 | T92 | all | |
| 22 | 1993–2022 | T93 | all | |
| 23 | 2023–2025 | T93 + S23 | all | exists: `2023-plus.json` |

That makes **23 consecutive eras, or 17 distinct rules** if identical non-consecutive rules share a file through `validFor`. The shared rules are: T50 best 4 of 6 (1950, 1956, 1957); T50 best 5 of 8 (1951–55, 1962–63); T50 best 6 of 10 (1961, 1965, 1967–68); T50 best 5 of 9 (1964, 1966); T69 best 6 of 11 (1970, 1971, 1973).

**Count depends on the Round count, 1950–1975.** In every Season from 1950 to 1975, N equals ⌊R/2⌋ + 1, R being the number of 500cc Rounds that counted. That is exactly the footnote rule "number of championship rounds divided by two, plus one" ([List](https://en.wikipedia.org/wiki/List_of_FIM_World_Championship_points_scoring_systems)). The rule does not hold for 1949 (best 3 of 6), 1976 or 1991. A rule shaped as "best N-of-all" with N derived from the Round count would cover 1950–1975 with just two files (T50 and T69), at the cost of moving logic back into code; that is a call for ADR-0003. Simple best-N fits better than a split window in 1972, 1973 and 1974: a two-half split fails for Kneubühler 1972 (48 against 54), Giger 1973 (43 against 44) and Read 1974 (70 against 82).

## 3. Per-Season exceptions

**Half points (Session multiplier 0.5).**
- **1989 Belgian GP**, R10: "awarded half points for the rain-drenched Belgian Grand Prix" ([wp 1989](https://en.wikipedia.org/wiki/1989_Grand_Prix_motorcycle_racing_season)). Arithmetic confirms it. It is the **only premier-class half-points Session found** from 1949 to 2025. The 1995 half points were 125cc only ([wp 1995](https://en.wikipedia.org/wiki/1995_Grand_Prix_motorcycle_racing_season)), as were those of 2009 (125cc and 250cc, [wp 2009](https://en.wikipedia.org/wiki/2009_Grand_Prix_motorcycle_racing_season)).
- **Rule texts.** One version of the stopped-race rule reads: more than 3 laps but under ⅔ of the distance with no restart gives half points; over ⅔ gives a result with full points ([Repsol, 2020, updated 2023](https://www.boxrepsol.com/en/motogp-en/what-happens-when-the-red-flag-is-waved-during-motogp-race/)). For 2023 Japan, however, the season article says "full points were awarded since at least 50% of the original race distance were completed" ([wp 2023](https://en.wikipedia.org/wiki/2023_MotoGP_World_Championship)). The 2004 article paraphrases the regulations: a race that cannot be restarted "counts as complete and full points are awarded" ([wp 2004](https://en.wikipedia.org/wiki/2004_Grand_Prix_motorcycle_racing_season)). The threshold history is open (§5).

**Stopped races that kept full points:** 2008 Indianapolis, ended early by wind ([wp 2008](https://en.wikipedia.org/wiki/2008_Grand_Prix_motorcycle_racing_season); Rossi's 373 requires 25 points). 2023 Japan, as above (Bagnaia's and Martín's totals require full points).

**Two-part or re-run races, recorded as one Aggregate classification or a re-run result:** 1983 British GP, two stages on aggregate time ([wp 1983](https://en.wikipedia.org/wiki/1983_Grand_Prix_motorcycle_racing_season)). 2004 Italian GP: 17 laps stopped by rain, then a 6-lap race whose result stood, the first part setting only the grid ([wp 2004](https://en.wikipedia.org/wiki/2004_Grand_Prix_motorcycle_racing_season)). 1989 Belgium was restarted three times "contrary to FIM race regulations" ([wp 1989](https://en.wikipedia.org/wiki/1989_Grand_Prix_motorcycle_racing_season)).

**Excluded, non-championship or cancelled 500cc/MotoGP races.** Each is a candidate Non-championship round, or simply not a Round.
- **1953 German GP**: the factory teams withdrew, and the 350cc and 500cc races were "only counted as an ordinary international event" ([wp 1953](https://en.wikipedia.org/wiki/1953_Grand_Prix_motorcycle_racing_season)). The standings table has no German column.
- **1954 Ulster GP**: the 500cc race "was excluded by the FIM as a points scoring round after heavy rain reduced the race distance" ([List](https://en.wikipedia.org/wiki/List_of_FIM_World_Championship_points_scoring_systems); [wp 1954](https://en.wikipedia.org/wiki/1954_Grand_Prix_motorcycle_racing_season)).
- **1959 Swedish GP**: the 500cc race (won by Bob Brown) "did not count towards the World Championship" ([wp 1959](https://en.wikipedia.org/wiki/1959_Grand_Prix_motorcycle_racing_season)).
- **1973 Nations GP**: the 500cc race was cancelled after the Saarinen/Pasolini accident ([wp 1973](https://en.wikipedia.org/wiki/1973_Grand_Prix_motorcycle_racing_season)).
- **2011 Malaysian GP**: cancelled after Simoncelli's fatal crash on lap 2, marked C; a cancelled race "will not count for the Championship" ([wp 2011](https://en.wikipedia.org/wiki/2011_Grand_Prix_motorcycle_racing_season)).
- **2018 British GP**: cancelled for rain, marked C ([wp 2018](https://en.wikipedia.org/wiki/2018_MotoGP_World_Championship)).
- **2023 Australian GP**: Sprint cancelled for weather and the Grand Prix race moved to Saturday ([wp 2023](https://en.wikipedia.org/wiki/2023_MotoGP_World_Championship)).
- Weekends with no 500cc class at all (e.g. 1961 Spain, 1970–71 Czechoslovakia, 1974–75 Spain/Yugoslavia, 1976 Yugoslavia/Spain, 1979 Czechoslovakia, 1980 Yugoslavia/Czechoslovakia) are not 500cc Rounds. The Round counts above exclude them; they come from the per-Season standings columns.

**Exclusions, disqualifications and Points overrides.**
- **1973**: Charlie Sanby (3rd, Isle of Man) "is excluded from the FIM championship final standings": he held only a domestic licence ([wp 1973](https://en.wikipedia.org/wiki/1973_Grand_Prix_motorcycle_racing_season)). This needs a Points override (0). Whether the finishers behind him were promoted is unknown.
- **DSQ Results that score nothing under the rule** (no override needed): 1976 Länsivuori, Austria (did not stop his engine while refuelling); 1998 Biaggi, Catalonia; 2002 Biaggi, R3; 2013 Márquez, Australia ([wp 1976](https://en.wikipedia.org/wiki/1976_Grand_Prix_motorcycle_racing_season), [1998](https://en.wikipedia.org/wiki/1998_Grand_Prix_motorcycle_racing_season), [2002](https://en.wikipedia.org/wiki/2002_Grand_Prix_motorcycle_racing_season), [2013](https://en.wikipedia.org/wiki/2013_MotoGP_World_Championship)).
- **Penalties that did not touch rider points**: 2013 Aragón, where Márquez's win was deducted for constructors only (his 334 includes the 25); 2020 Yamaha engine-valve penalties, applied to manufacturer and team only ("no penalty was applied to individual riders' point totals") ([wp 2013](https://en.wikipedia.org/wiki/2013_MotoGP_World_Championship), [wp 2020](https://en.wikipedia.org/wiki/2020_MotoGP_World_Championship)).
- **Shared points**: 1972 Senior TT, where "Clive Brown and Paul Cott set equal times … and tie for eighth place" ([wp 1972](https://en.wikipedia.org/wiki/1972_Grand_Prix_motorcycle_racing_season)). It is not known whether each got the 3 points for 8th or they split 3+2. No other dead heat was found.

**Boycotts that still counted**: 1977 Austria (riders' strike), 1979 Belgium, 1982 France at Nogaro (Frutschi won against a field without the factory riders). The 1974 German GP and Isle of Man were boycotted by most contenders ([wp 1977](https://en.wikipedia.org/wiki/1977_Grand_Prix_motorcycle_racing_season), [1979](https://en.wikipedia.org/wiki/1979_Grand_Prix_motorcycle_racing_season), [1982](https://en.wikipedia.org/wiki/1982_Grand_Prix_motorcycle_racing_season), [1974](https://en.wikipedia.org/wiki/1974_Grand_Prix_motorcycle_racing_season)).

## 4. Tie-breaks

| Season | Tie | How it was broken | Source |
|---|---|---|---|
| 1967 | Agostini and Hailwood on 46 Championship points, both with 5 wins | Agostini champion "due to his three second place finishes to Hailwood's two" | [wp 1967](https://en.wikipedia.org/wiki/1967_Grand_Prix_motorcycle_racing_season), [Raines](https://www.nick-harris.co.uk/?p=2028) |
| 1982 | Roberts and Sheene on 68 | Roberts 4th: 2 wins against 0, consistent with Countback | [wp 1982](https://en.wikipedia.org/wiki/1982_Grand_Prix_motorcycle_racing_season) |
| 1991 | Kocinski and Gardner on 161 | Kocinski 4th: 1 win (Malaysia) against 0, consistent with Countback | [wp 1991](https://en.wikipedia.org/wiki/1991_Grand_Prix_motorcycle_racing_season), [speedweek](https://speedweek.com/motogp500/wmstand/560/1991.html) |
| 2004 regs | — | "first by the number of best place finishes, then by the date each rider achieved their highest place, with the latest result taking precedence" (= Countback, then the Latest-best tie-break) | [wp 2004](https://en.wikipedia.org/wiki/2004_Grand_Prix_motorcycle_racing_season) |
| 2006 | none (Hayden 252, Rossi 247) | "Had there been a tie, Rossi would have been crowned … due to more race victories" | [wp 2006](https://en.wikipedia.org/wiki/2006_Grand_Prix_motorcycle_racing_season) |
| 2015 | mid-season, after Brno | Lorenzo led "on countback" | [wp 2015](https://en.wikipedia.org/wiki/2015_MotoGP_World_Championship) |

**The biggest finding is in 1967: Countback counted Dropped scores.** Counting only the best-6 Round scores, each Rider had 5 wins and one second place, a perfect tie. Agostini's third second place, which broke it, was a Dropped score. Countback therefore ran over **all** Grand Prix race results, not just the counting ones. A tie-break implemented only over counted Round scores would leave 1967 tied. No era-specific tie-break text was found before 2004. The 1982 and 1991 orders are consistent with Countback; the Latest-best tie-break was never tested in a final table.

## 5. Open questions and re-checks

**Not pinned down**
1. **2025**: rule and totals are sourced, but there was no per-Round arithmetic, because no reachable copy of the final standings table had per-Round cells. Re-check against the motogp.com 2025 standings.
2. **Non-binding Seasons, 1952, 1955, 1956, 1962**: the top Riders never scored in more than N Rounds, so the arithmetic proves only N≥5 (1952, 1955, 1962) and N≥4 (1956). The exact N rests on Wikipedia's prose, and on the ⌊R/2⌋+1 footnote. A lower-placed Rider with more scores would settle it; such Riders were not checked.
3. **Round numbering for excluded races** (1953 German, 1954 Ulster, 1959 Swedish, 1973 Nations, 2011 Malaysia, 2018 Britain): should they be Non-championship rounds inside the numbering? If they are, each Counting window's `toRound` must widen, e.g. 1954 becomes best 5 of R1–9.
4. **1983 Mamola**: the Wikipedia cells sum to 90 against 89 printed. That is one point, too small for a dropped-score rule, so a cell is probably wrong; possibly linked to the two-part British GP.
5. **1972 IOM dead heat for 8th** (Brown/Cott): shared or full points?
6. **1973 Sanby exclusion**: were the IOM finishers behind him promoted, and did Findlay's total change?
7. **Stopped-race thresholds**: when the cut-off moved from ⅔ (half points below) to 50% (full points above, as in 2023 Japan), and what applies to a stopped Sprint.
8. **Countback over Dropped scores**: confirmed for 1967 only. Is it the rule in every dropped-score Season (1949–1976, 1991)? The FIM rule text is needed.
9. **Sprint in Countback** (2023+): the glossary says Sprint results do not count; there is no source here either way.
10. **1976 internal contradiction**: Wikipedia prose says "top 6 results", while its cited footnote and the arithmetic say 3+3 (Länsivuori 48, not 54). This is settled by arithmetic, but worth confirming.
11. **1980**: Wikipedia is inconsistent about which rounds were cancelled (Venezuela, Sweden or Austria). The 8 scoring Rounds are unaffected.
12. **1988 and 1990**: arithmetic shows every Round counted, so `1988-91.json` (claimed for 1989 only) can be extended to 1988 and 1990, but **not 1991**.

**Re-check by hand against motogp.com / the FIM (priority order)**
- 1991 best-13 rule (the only dropped-score Season after 1976), and 1976 windows.
- 1967 tie-break, and whether Countback uses Dropped scores.
- 1989 Belgian half points, and the absence of any other premier-class half-points Session.
- The excluded 500cc races of 1953, 1954 and 1959, and the 1973 Sanby exclusion.
- The N of each Season 1950–1975, starting with the four non-binding ones.
- 2025 final per-Round standings; the 2023 Australian Sprint cancellation; 2023 Japan full points.
- 1983 Mamola total; the 1972 dead heat.
- Stopped-race and half-points regulation text for 2004, 2008, 2023 and 2025.
