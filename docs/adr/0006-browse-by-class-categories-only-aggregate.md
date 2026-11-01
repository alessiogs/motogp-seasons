# Seasons are browsed by Class; Categories only aggregate

The site is browsed by Season of a Class, at `/[class]/[year]` (e.g. `/500cc/1975`, `/motogp/2024`), because a year can have up to five Classes and each has its own championship. Categories (Premier: 500cc → MotoGP; Intermediate: 250cc → Moto2; Lightweight: 125cc → Moto3; 350cc; Smallest: 50cc → 80cc) exist only to link Classes of one lineage for statistics across it.

Category statistics add up counts (titles, wins, podiums) and never points, because points systems differ across eras and summing them would be meaningless. We considered making the Category the browsing unit (e.g. `/premier/1975`) and rejected it: it hides which Class a Season actually was.
