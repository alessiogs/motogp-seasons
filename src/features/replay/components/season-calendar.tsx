import type { CalendarEntry } from '../types/calendar-entry';

/** Every Round of the Season, with Non-championship rounds marked and Round notes shown. */
export default function SeasonCalendar({ calendar }: { calendar: CalendarEntry[] }) {
  return (
    <section className="calendar">
      <h2>Calendar</h2>
      <ol>
        {calendar.map((entry) => (
          <li key={entry.roundNumber} className={entry.nonChampionship ? 'non-championship' : undefined}>
            <span className="calendar-title">
              {entry.name}
              {entry.date && <span className="muted"> · {entry.date}</span>}
              {entry.nonChampionship && <span className="calendar-badge">Non-championship · no points</span>}
            </span>
            {entry.notes && <span className="muted calendar-note">{entry.notes}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
