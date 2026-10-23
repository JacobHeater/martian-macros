import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import './charts.css';

interface NightsChartProps {
  /** Minutes asleep by the morning each night ended; a night not here was not recorded. */
  minutes: ReadonlyMap<CalendarDate, number>;
  today: CalendarDate;
  nights: number;
  /** The night the chips have chosen, drawn in the strongest neutral. */
  picked: CalendarDate;
  /** What the chart says, for a screen reader. */
  label: string;
}

const width = 320;
const height = 116;
const left = 28;
const bottom = 18;
const plotHeight = height - bottom - 4;
const gap = 4;

/**
 * The last nights of sleep as bars (MM-578), oldest on the left: hours
 * asleep, on gridlines every three hours that mark no target (the owner
 * ruled out sleep advice, MM-368). A night not recorded is an open slot on
 * the baseline, never a bar of nothing.
 */
export function NightsChart({ minutes, today, nights, picked, label }: NightsChartProps) {
  const start = today.addDays(1 - nights);
  const hours = Math.max(9, ...[...minutes.values()].map((m) => Math.ceil(m / 60)));
  const top = Math.ceil(hours / 3) * 3;
  const slot = (width - left) / nights;
  const y = (h: number) => 4 + plotHeight - (h / top) * plotHeight;
  const base = y(0);
  return (
    <svg className="chart-plot chart-nights" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {Array.from({ length: top / 3 + 1 }, (_, i) => i * 3).map((h) => (
        <g key={h}>
          <line className="chart-grid" x1={left} x2={width} y1={y(h)} y2={y(h)} />
          <text className="chart-axis" x={left - 6} y={y(h) + 4} textAnchor="end">
            {`${h} h`}
          </text>
        </g>
      ))}
      {Array.from({ length: nights }, (_, i) => {
        const date = start.addDays(i);
        const value = minutes.get(date);
        const x = left + i * slot + gap / 2;
        const kind = date === picked ? ' chart-night-picked' : '';
        return value === undefined ? (
          <rect key={i} className={`chart-night-missing${kind}`} x={x} y={base - 4} width={slot - gap} height={4} rx={2} />
        ) : (
          <rect key={i} className={`chart-night${kind}`} x={x} y={y(value / 60)} width={slot - gap} height={base - y(value / 60)} rx={3} />
        );
      })}
      <text className="chart-axis" x={left} y={height - 2}>
        {Fmt.shortDay(start)}
      </text>
      <text className="chart-axis" x={width} y={height - 2} textAnchor="end">
        Last night
      </text>
    </svg>
  );
}
