'use client';

import { useState } from 'react';
import type { StandingRow } from '@/features/scoring/types/standing-row';
import type { SeasonData } from '@/features/seasons/types/season-data';

interface Props {
  rounds: SeasonData['rounds'];
  riders: SeasonData['riders'];
  /** standings[i] = table after round i + 1 */
  standings: StandingRow[][];
}

export default function SeasonReplay({ rounds, riders, standings }: Props) {
  const last = standings.length - 1;
  const [idx, setIdx] = useState(last);

  if (standings.length === 0) return <p className="notice">No results for this season yet.</p>;

  const table = standings[idx];
  const prevRank = new Map((standings[idx - 1] ?? []).map((r) => [r.riderId, r.rank]));
  const leader = table[0]?.points ?? 0;
  const round = rounds[idx];

  return (
    <>
      <div className="controls">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous round">
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          aria-label="Round"
        />
        <button onClick={() => setIdx((i) => Math.min(last, i + 1))} disabled={idx === last} aria-label="Next round">
          ›
        </button>
      </div>

      <p className="round-label">
        After round {idx + 1} of {standings.length}
        {round && <> · {round.name}</>}
        {round?.date && <span className="muted"> · {round.date}</span>}
      </p>

      <table className="standings">
        <thead>
          <tr>
            <th>Pos</th>
            <th></th>
            <th>Rider</th>
            <th className="num">Pts</th>
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
                  {rider?.name ?? `#${row.riderId}`}
                  {rider?.nationality && <span className="muted"> {rider.nationality}</span>}
                </td>
                <td className="num">
                  {row.points}
                  {row.droppedRounds.length > 0 && (
                    <span className="muted" title={`Dropped rounds: ${row.droppedRounds.join(', ')}`}>
                      {' '}({row.grossPoints})
                    </span>
                  )}
                </td>
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
