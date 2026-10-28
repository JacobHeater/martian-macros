import type { CardioWeekTotals } from '../engine/CardioWeekTotals';
import { cardioActivityLabel } from '../format/cardioActivityLabel';
import { minutesText } from '../format/minutesText';
import { clamp } from '../lang/clamp';
import '../ui/ui.css';

/**
 * The week's cardio minutes by activity as bars (MM-680), as
 * `MuscleVolumeRow` draws a muscle group: the name and the minutes in words,
 * then a bar scaled to the floor (MM-678), the floor's band from the floor
 * on, and a thin marker for the same activity the seven days before. The
 * activities with the most minutes first; an activity with none this week
 * and none last week is not drawn.
 */
export function CardioActivityBars({ current, previous, floorMinutes }: { current: CardioWeekTotals; previous: CardioWeekTotals; floorMinutes: number }) {
  const rows = [...current.byActivity];
  for (const before of previous.byActivity) {
    if (!rows.some((row) => row.activity === before.activity)) rows.push({ activity: before.activity, minutes: 0, sessions: 0 });
  }
  if (rows.length === 0) return <p className="app-text">No sessions on the watch in the last seven days.</p>;
  const maximum = Math.max(floorMinutes, ...rows.map((row) => row.minutes), ...previous.byActivity.map((row) => row.minutes)) || 1;
  const percent = (value: number) => `${clamp(value / maximum, 0, 1) * 100}%`;
  return (
    <div>
      {rows.map((row) => {
        const name = cardioActivityLabel(row.activity);
        const before = previous.byActivity.find((other) => other.activity === row.activity)?.minutes ?? 0;
        return (
          <div key={row.activity} className="mm-volume-row">
            <p className="mm-volume-head">
              <span>{name}</span>
              <span>{minutesText(row.minutes)}</span>
            </p>
            <p className="mm-volume-detail">
              {row.sessions === 1 ? '1 session' : `${row.sessions} sessions`} · last week {minutesText(before)}
            </p>
            <div
              className="mm-volume-bar"
              role="img"
              aria-label={`${name}: ${minutesText(row.minutes)} this week; ${minutesText(before)} last week. Floor ${minutesText(floorMinutes)} a week.`}
            >
              <span className="mm-volume-reference" style={{ left: percent(floorMinutes), right: 0 }} />
              <span className="mm-volume-current" style={{ width: percent(row.minutes) }} />
              <span className="mm-volume-previous" style={{ left: `min(${percent(before)}, calc(100% - 2px))` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
