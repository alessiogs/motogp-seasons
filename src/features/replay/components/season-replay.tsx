'use client';

import { useState } from 'react';
import type { ReplayStep } from '@/features/scoring/types/replay-step';
import { sessionLabel } from '../logic/session-label';
import type { ClassificationRow } from '../logic/classification';
import FlagBadge from './flag-badge';
import StepDetails from './step-details';

const ROW_HEIGHT = 44;

interface Props {
  rounds: { number: number; name: string; date: string | null }[];
  riders: Record<string, { name: string; nationality: string | null }>;
  /** One Step per Session, in order. */
  steps: ReplayStep[];
  /** Full Classification of each Step's Session, keyed `${roundNumber}/${sessionType}`. */
  classifications: Record<string, ClassificationRow[]>;
  /** The Season's Scoring rule has Counting windows: show Gross points and Dropped scores. */
  hasCountingWindows?: boolean;
}

export default function SeasonReplay({ rounds, riders, steps, classifications, hasCountingWindows = false }: Props) {
  const last = steps.length - 1;
  const [idx, setIdx] = useState(last);

  if (steps.length === 0) return <p className="notice">No results for this season yet.</p>;

  const step = steps[idx];
  const table = step.standings;
  const prevRank = new Map((steps[idx - 1]?.standings ?? []).map((r) => [r.riderId, r.rank]));
  const leader = table[0]?.points ?? 0;
  const classification = classifications[`${step.roundNumber}/${step.sessionType}`];
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

      <div className={`standings${hasCountingWindows ? ' windowed' : ''}`} role="table" aria-label="Standings" style={{ height: (table.length + 1) * ROW_HEIGHT }}>
        <div className="standings-row standings-head" role="row">
          <span>Pos</span>
          <span></span>
          <span>Rider</span>
          <span className="num">Pts</span>
          {hasCountingWindows && <span className="num">Gross</span>}
          <span className="num">Gap</span>
          <span className="num">Wins</span>
        </div>
        {/* Rows are keyed by Rider and placed by rank, so changing Step slides them to their new positions. */}
        {[...table]
          .sort((a, b) => (a.riderId < b.riderId ? -1 : 1))
          .map((row) => {
            const before = prevRank.get(row.riderId);
            const delta = before == null || idx === 0 ? 0 : before - row.rank;
            const rider = riders[row.riderId];
            return (
              <div
                key={row.riderId}
                className={`standings-row${row.rank === 1 ? ' leader' : ''}`}
                role="row"
                style={{ transform: `translateY(${row.rank * ROW_HEIGHT}px)` }}
              >
                <span>{row.rank}</span>
                <span className={delta > 0 ? 'up' : delta < 0 ? 'down' : 'same'}>
                  {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : ''}
                </span>
                <span className="rider-cell">
                  <FlagBadge code={rider?.nationality ?? null} /> {rider?.name ?? row.riderId}
                  {hasCountingWindows && row.droppedRounds.length > 0 && (
                    <span className="dropped" title="Dropped scores">
                      dropped:{' '}
                      {row.droppedRounds.map((n) => (
                        <span key={n}>
                          R{n} <s>{row.roundScores[n - 1]}</s>{' '}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="num">{row.points}</span>
                {hasCountingWindows && <span className="num muted">{row.grossPoints}</span>}
                <span className="num muted">{row.rank === 1 ? '' : `-${leader - row.points}`}</span>
                <span className="num">{row.wins || ''}</span>
              </div>
            );
          })}
      </div>

      {classification && <StepDetails classification={classification} riders={riders} />}
    </>
  );
}
