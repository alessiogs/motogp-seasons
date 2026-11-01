export function applyBestN(roundScores: number[], bestN: number | null) {
  if (bestN == null || roundScores.length <= bestN) {
    return { kept: sum(roundScores), droppedRounds: [] as number[] };
  }
  // Sort round indices by score desc; on equal scores drop the earlier round (stable, arbitrary but deterministic).
  const order = roundScores
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score || b.idx - a.idx);
  const kept = sum(order.slice(0, bestN).map((o) => o.score));
  const droppedRounds = order
    .slice(bestN)
    .filter((o) => o.score > 0)
    .map((o) => o.idx + 1)
    .sort((a, b) => a - b);
  return { kept, droppedRounds };
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
