import type { CountingWindow } from '../types/scoring-rule';

/**
 * Applies Counting windows to Round scores (index 0 = Round 1), considering only the
 * Rounds already run: each window looks at its Rounds up to the last one scored.
 * On equal Round scores the earlier Round is the one dropped (ADR-0004).
 */
export function applyCountingWindows(roundScores: number[], windows: CountingWindow[]) {
  const dropped: number[] = [];
  for (const w of windows) {
    const inWindow = roundScores
      .map((score, idx) => ({ score, round: idx + 1 }))
      .filter((r) => r.round >= w.fromRound && r.round <= w.toRound);
    if (inWindow.length <= w.count) continue;
    inWindow.sort((a, b) => b.score - a.score || b.round - a.round);
    for (const r of inWindow.slice(w.count)) if (r.score > 0) dropped.push(r.round);
  }
  dropped.sort((a, b) => a - b);
  const droppedTotal = dropped.reduce((sum, round) => sum + roundScores[round - 1], 0);
  const gross = roundScores.reduce((a, b) => a + b, 0);
  return { kept: gross - droppedTotal, droppedRounds: dropped };
}
