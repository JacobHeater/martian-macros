import type { CalendarDate } from '../domain/CalendarDate';
import type { StepsDay } from '../domain/training/StepsDay';
import { Fmt } from '../format/Fmt';
import './charts.css';

const width = 320;
const height = 120;
const left = 44;
const bottom = 22;
const plotHeight = height - bottom - 6;
const gap = 6;
const days = 7;

const letters = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const;
const weekdayOf = (date: CalendarDate) => new Date(date.year, date.month - 1, date.day).getDay();

/** Thousands with a k, for the axis: "8k", "12.5k". */
const short = (steps: number) => (steps >= 1000 ? `${Number((steps / 1000).toFixed(1))}k` : `${steps}`);

/**
 * The last seven days' steps as bars (MM-680), oldest on the left, each
 * over its weekday, as `NightsChart` draws nights: a day with no total is
 * an open slot on the baseline, never a bar of nothing; today's bar is lit.
 * One line across marks the floor (MM-678). One quiet series, no legend, no
 * number on a bar: the figures beside the chart carry them.
 */
export function StepsByDayChart({ steps, today, floor }: { steps: readonly StepsDay[]; today: CalendarDate; floor: number }) {
  const start = today.addDays(1 - days);
  const byDay = new Map(steps.map((day) => [day.date.epochDay, day.steps]));
  const top = Math.max(floor * 1.25, ...steps.map((day) => day.steps)) || floor;
  const slot = (width - left) / days;
  const y = (value: number) => 6 + plotHeight - (value / top) * plotHeight;
  const base = y(0);
  const counted = Array.from({ length: days }, (_, i) => byDay.get(start.addDays(i).epochDay)).filter((v): v is number => v !== undefined);
  const label =
    counted.length === 0
      ? `Steps by day, last seven days: none counted. Floor ${Fmt.whole(floor)} a day.`
      : `Steps by day, last seven days: ${counted.length} of 7 counted, from ${Fmt.whole(Math.min(...counted))} to ${Fmt.whole(Math.max(...counted))}. Floor ${Fmt.whole(floor)} a day.`;
  return (
    <svg className="chart-plot chart-steps-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <line className="chart-grid" x1={left} x2={width} y1={base} y2={base} />
      <line className="chart-steps-floor" x1={left} x2={width} y1={y(floor)} y2={y(floor)} />
      <text className="chart-axis" x={left - 6} y={y(floor) + 4} textAnchor="end">
        {short(floor)}
      </text>
      {Array.from({ length: days }, (_, i) => {
        const date = start.addDays(i);
        const value = byDay.get(date.epochDay);
        const x = left + i * slot;
        const isToday = i === days - 1;
        const kind = isToday ? ' chart-steps-today' : '';
        return (
          <g key={i}>
            {value === undefined ? (
              <rect className={`chart-steps-missing${kind}`} x={x + gap / 2} y={base - 4} width={slot - gap} height={4} rx={2} />
            ) : (
              <rect className={`chart-steps${kind}`} x={x + gap / 2} y={y(value)} width={slot - gap} height={base - y(value)} rx={3} />
            )}
            <text className={`chart-axis chart-steps-letter${kind}`} x={x + slot / 2} y={height - 6} textAnchor="middle">
              {letters[weekdayOf(date)]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
