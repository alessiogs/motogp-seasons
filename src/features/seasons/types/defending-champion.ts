/** The previous Season's World Champion in the same Category (GLOSSARY: Defending Champion). */
export interface DefendingChampion {
  riderId: string;
  /** Named here because they may have no Result, and so no name, in the Season they defend. */
  name: string;
}
