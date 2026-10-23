import type { KeyboardEvent, MouseEvent, Ref } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { linePath } from './linePath';
import './charts.css';

interface NightsChartProps {
  /** Minutes asleep by the morning each night ended; a night not here was not recorded. */
  minutes: ReadonlyMap<CalendarDate, number>;
  today: CalendarDate;
  nights: number;
  /** The night chosen to type or correct, drawn in the strongest neutral. */
  picked: CalendarDate;
  /** Chooses a night: a tap on its column, or the arrow keys. */
  onPick: (night: CalendarDate) => void;
  /** What the chart says, for a screen reader. */
  label: string;
  /** Where focus goes back to after a night is saved. */
  ref?: Ref<SVGSVGElement>;
}

const width = 320;
const height = 132;
const left = 28;
const bottom = 22;
const plotHeight = height - bottom - 4;
const gap = 4;

/** The trendline's window: the nights either side of each one it averages. */
const reach = 3;

const letters = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const;
const weekdayOf = (date: CalendarDate) => new Date(date.year, date.month - 1, date.day).getDay();

/**
 * The last nights of sleep as bars (MM-578), oldest on the left, each over
 * its morning's weekday: hours asleep, on gridlines every three hours that
 * mark no target (the owner ruled out sleep advice, MM-368). A night not
 * recorded is an open slot on the baseline, never a bar of nothing. The
 * chart is how a night is chosen, as the trend chart's weigh-ins are
 * (MM-142): a tap anywhere in a night's column, or the arrow keys, Home and
 * End; the chosen night's column is lit. Over the bars, a trendline: each
 * night's centred seven-night average of the nights recorded, from three of
 * them, broken where there are fewer, so a gap is never drawn as a trend.
 */
export function NightsChart({ minutes, today, nights, picked, onPick, label, ref }: NightsChartProps) {
  const start = today.addDays(1 - nights);
  const hours = Math.max(9, ...[...minutes.values()].map((m) => Math.ceil(m / 60)));
  const top = Math.ceil(hours / 3) * 3;
  const slot = (width - left) / nights;
  const y = (h: number) => 4 + plotHeight - (h / top) * plotHeight;
  const base = y(0);
  const at = start.daysUntil(picked);
  const average = (i: number): number | undefined => {
    const window = Array.from({ length: 2 * reach + 1 }, (_, k) => minutes.get(start.addDays(i - reach + k))).filter(
      (value): value is number => value !== undefined,
    );
    return window.length < reach ? undefined : window.reduce((sum, value) => sum + value, 0) / window.length / 60;
  };
  const trend = Array.from({ length: nights }, (_, i) => {
    const value = average(i);
    return value === undefined ? undefined : ([left + (i + 0.5) * slot, y(value)] as const);
  });

  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const tapped = (event.target as Element).getAttribute('data-ago');
    if (tapped !== null) {
      onPick(today.addDays(-Number(tapped)));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const i = Math.floor((((event.clientX - rect.left) / rect.width) * width - left) / slot);
    if (i >= 0 && i < nights) onPick(start.addDays(i));
  };

  const move = (event: KeyboardEvent<SVGSVGElement>) => {
    const steps: Readonly<Record<string, number>> = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: nights - 1 };
    const next = steps[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onPick(start.addDays(Math.min(nights - 1, Math.max(0, next))));
  };

  return (
    <svg
      ref={ref}
      className="chart-plot chart-nights"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      tabIndex={0}
      onClick={pick}
      onKeyDown={move}
    >
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
        const x = left + i * slot;
        const chosen = i === at;
        const kind = chosen ? ' chart-night-picked' : '';
        return (
          <g key={i}>
            {chosen ? <rect className="chart-night-column" x={x} y={0} width={slot} height={height} rx={4} /> : null}
            {value === undefined ? (
              <rect className={`chart-night-missing${kind}`} x={x + gap / 2} y={base - 4} width={slot - gap} height={4} rx={2} />
            ) : (
              <rect className={`chart-night${kind}`} x={x + gap / 2} y={y(value / 60)} width={slot - gap} height={base - y(value / 60)} rx={3} />
            )}
            <text className={`chart-axis chart-night-letter${kind}`} x={x + slot / 2} y={height - 6} textAnchor="middle">
              {letters[weekdayOf(date)]}
            </text>
            {/* The whole column answers a tap, not only the bar. */}
            <rect className="chart-night-hit" data-ago={nights - 1 - i} x={x} y={0} width={slot} height={height} />
          </g>
        );
      })}
      <path className="chart-line chart-night-trend" d={linePath(trend)} strokeWidth={2.5} />
    </svg>
  );
}
