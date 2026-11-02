'use client';

import { useState } from 'react';
import { sessionLabel } from '../logic/session-label';
import type { ReplayView } from '../types/replay-view';
import FlagBadge from './flag-badge';
import NumBox from './num-box';
import StepDetails from './step-details';
import TitleRacePanel from './title-race-panel';

const ROW_HEIGHT = 44;

export default function SeasonReplay({ view }: { view: ReplayView }) {
  const { steps, riders, calendar, hasCountingWindows, fastestLapBonus, participantsNote } = view;
  const last = steps.length - 1;
  const [idx, setIdx] = useState(last);

  if (steps.length <= 1) return <p className="notice">No results for this season yet.</p>;

  const step = steps[idx];
  const table = step.standings;
  const { round } = step;
  const champion = step.worldChampion;
  const roundName = (n: number) => calendar.find((r) => r.roundNumber === n)?.name ?? `Round ${n}`;
  const riderName = (id: string) => riders[id]?.name ?? id;

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

      {round == null ? (
        <>
          <p className="round-label">
            Step {idx + 1} of {steps.length} · Participants
          </p>
          {participantsNote && <p className="round-note muted">{participantsNote}</p>}
        </>
      ) : (
        <>
          <p className="round-label">
            Step {idx + 1} of {steps.length} · Round {step.roundNumber} · {round.name}
            {step.sessionsInRound > 1 && <> · {sessionLabel(step.sessionType)}</>}
            {round.date && <span className="muted"> · {round.date}</span>}
          </p>
          {round.notes && <p className="round-note muted">{round.notes}</p>}
        </>
      )}

      <TitleRacePanel
        step={step}
        next={steps[idx + 1]}
        crowning={step.crowning}
        roundName={roundName}
        riderName={riderName}
        fastestLapBonus={fastestLapBonus}
      />

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
            const delta = row.rankChange;
            const rider = riders[row.riderId];
            const seasonNumber = rider?.seasonNumber ?? null;
            return (
              <div
                key={row.riderId}
                className={`standings-row${row.rank === 1 && row.points > 0 ? ' leader' : ''}${row.riderId === champion ? ' champion' : ''}`}
                role="row"
                style={{ transform: `translateY(${row.rank * ROW_HEIGHT}px)` }}
              >
                <span>{row.rank}</span>
                <span className={delta > 0 ? 'up' : delta < 0 ? 'down' : 'same'}>
                  {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : ''}
                </span>
                <span className="rider-cell">
                  {seasonNumber != null && (
                    <NumBox
                      number={seasonNumber}
                      background={row.box.background}
                      foreground={row.box.foreground}
                      title={`Season number ${seasonNumber}`}
                    />
                  )}
                  <FlagBadge code={rider?.nationality ?? null} /> {rider?.name ?? row.riderId}
                  {step.crowning && row.riderId === champion && <span className="champion-badge">World Champion</span>}
                  {row.riderId === step.defendingChampion && <span className="defending-badge">Defending Champion</span>}
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
                <span className="num muted">{row.gap == null ? '' : `-${row.gap}`}</span>
                <span className="num">{row.wins || ''}</span>
              </div>
            );
          })}
      </div>

      {step.kind === 'session' && <StepDetails podium={step.podium} belowPodium={step.belowPodium} riders={riders} />}
    </>
  );
}
