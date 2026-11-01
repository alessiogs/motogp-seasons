'use client';

import { useState } from 'react';
import type { ReplayStep } from '@/features/scoring/types/replay-step';
import { sessionLabel } from '../logic/session-label';

interface Props {
  rounds: { number: number; name: string; date: string | null }[];
  riders: Record<string, { name: string; nationality: string | null }>;
  /** One Step per Session, in order. */
  steps: ReplayStep[];
  /** The Season's Scoring rule has Counting windows: show Gross points and Dropped scores. */
  hasCountingWindows?: boolean;
}

export default function SeasonReplay({ rounds, riders, steps, hasCountingWindows = false }: Props) {
  const last = steps.length - 1;
  const [idx, setIdx] = useState(last);

  if (steps.length === 0) return <p className="notice">No results for this season yet.</p>;

  const step = steps[idx];
  const table = step.standings;
  const prevRank = new Map((steps[idx - 1]?.standings ?? []).map((r) => [r.riderId, r.rank]));
  const leader = table[0]?.points ?? 0;
  const round = rounds.find((r) => r.number === step.roundNumber);

  return (
    <>
      <div className="controls">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous step">
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          aria-label="Step"
        />
        <button onClick={() => setIdx((i) => Math.min(last, i + 1))} disabled={idx === last} aria-label="Next step">
          ›
        </button>
      </div>

      <p className="round-label">
        Step {idx + 1} of {steps.length} · Round {step.roundNumber}
        {round && <> · {round.name}</>}
        {step.sessionsInRound > 1 && <> · {sessionLabel(step.sessionType)}</>}
        {round?.date && <span className="muted"> · {round.date}</span>}
      </p>

      <table className="standings">
        <thead>
          <tr>
            <th>Pos</th>
            <th></th>
            <th>Rider</th>
            <th className="num">Pts</th>
            {hasCountingWindows && <th className="num">Gross</th>}
            {hasCountingWindows && <th>Dropped</th>}
            <th className="num">Gap</th>
            <th className="num">Wins</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row) => {
            const before = prevRank.get(row.riderId);
            const delta = before == null || idx === 0 ? 0 : before - row.rank;
            const rider = riders[row.riderId];
            return (
              <tr key={row.riderId}>
                <td>{row.rank}</td>
                <td className={delta > 0 ? 'up' : delta < 0 ? 'down' : 'same'}>
                  {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : ''}
                </td>
                <td>
                  {rider?.name ?? row.riderId}
                  {rider?.nationality && <span className="muted"> {rider.nationality}</span>}
                </td>
                <td className="num">{row.points}</td>
                {hasCountingWindows && <td className="num muted">{row.grossPoints}</td>}
                {hasCountingWindows && (
                  <td className="dropped">
                    {row.droppedRounds.map((n) => (
                      <span key={n} className="dropped-score" title={`Round ${n} score dropped (${row.roundScores[n - 1]} points)`}>
                        R{n} <s>{row.roundScores[n - 1]}</s>
                      </span>
                    ))}
                  </td>
                )}
                <td className="num muted">{row.rank === 1 ? '' : `-${leader - row.points}`}</td>
                <td className="num">{row.wins || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
