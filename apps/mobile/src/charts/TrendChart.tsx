import type { KeyboardEvent, MouseEvent } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightEvent } from '../domain/WeightEvent';
import type { WeightObservation } from '../domain/WeightObservation';
import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import { Fmt } from '../format/Fmt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { linePath } from './linePath';
import './charts.css';

interface TrendChartProps {
  trend: readonly WeightTrendPoint[];
  weights: readonly WeightObservation[];
  today: CalendarDate;
  rangeDays: number;
  fmt: Fmt;
  weightEvents?: readonly WeightEvent[];
  /** The spans the trend widens its noise over around each period start (MM-20), shaded so the wider band is explained. */
  cycleWindows?: readonly { from: CalendarDate; to: CalendarDate }[];
  /** What the chart says, for a screen reader (the chart itself is drawn). */
  label: string;
  /** The weigh-in the person chose, drawn larger (MM-142). */
  pickedDay?: CalendarDate | undefined;
  /** Called with a weigh-in's day when its dot, or the chart near it, is tapped (MM-142). */
  onPickDay?: ((date: CalendarDate) => void) | undefined;
}

/** How far from a dot, in the chart's own units, a tap still picks it. */
const pickReach = 12;

const width = 320;
const height = 190;
const left = 40;
const bottom = 24;
const plotWidth = width - left - 4;
const plotHeight = height - bottom - 4;

/**
 * The weight trend: the estimated trend as a line, two standard deviations
 * either side as a band, each weigh-in as a dot, a dashed line on each
 * day a weight event was noted, and a quiet shade over the days around a
 * period start, where the band is wider by design (MM-20).
 */
export function TrendChart({
  trend,
  weights,
  today,
  rangeDays,
  fmt,
  weightEvents = [],
  cycleWindows = [],
  label,
  pickedDay,
  onPickDay,
}: TrendChartProps) {
  const start = today.addDays(1 - rangeDays);
  const points = trend.filter((p) => !p.date.isBefore(start));
  if (points.length === 0) return <p className="chart-empty chart-empty-tall">No weigh-ins in this range.</p>;

  const dayOf = (date: CalendarDate) => start.daysUntil(date);
  const at = (p: WeightTrendPoint, sigmas: number) => fmt.weightFromKg(p.levelKg + sigmas * p.levelSigmaKg);
  const raw = weights
    .filter((w) => !w.date.isBefore(start))
    .map((w) => ({ day: dayOf(w.date), value: fmt.weightFromKg(w.weightKg), date: w.date }));
  const ys = [...raw.map(({ value }) => value), ...points.map((p) => at(p, 2)), ...points.map((p) => at(p, -2))];
  const lowest = Math.min(...ys);
  const highest = Math.max(...ys);
  const pad = Math.max((highest - lowest) * 0.1, 0.5);
  const low = lowest - pad;
  const high = highest + pad;

  const x = (day: number) => left + (rangeDays <= 1 ? plotWidth / 2 : (day / (rangeDays - 1)) * plotWidth);
  const y = (value: number) => 4 + plotHeight - ((value - low) / (high - low)) * plotHeight;
  const along = (sigmas: number) => points.map((p) => [x(dayOf(p.date)), y(at(p, sigmas))] as const);
  const band = `${linePath(along(2))}${linePath([...along(-2)].reverse()).replace('M', 'L')}Z`;
  const events = weightEvents.filter((event) => !event.date.isBefore(start) && !event.date.isAfter(today));
  const last = today.addDays(-1);
  const shaded = cycleWindows
    .map(({ from, to }) => ({ from: from.isBefore(start) ? start : from, to: to.isAfter(last) ? last : to }))
    .filter(({ from, to }) => !to.isBefore(from));
  const gridValues = [1, 2, 3].map((step) => low + ((high - low) / 4) * step);

  // A tap on a dot picks that weigh-in; a tap near one, anywhere down the plot, picks the nearest (MM-142).
  const pick = (event: MouseEvent<SVGSVGElement>) => {
    if (onPickDay === undefined || raw.length === 0) return;
    const tapped = (event.target as Element).getAttribute('data-day');
    let chosen = tapped === null ? undefined : raw.find((r) => r.day === Number(tapped));
    if (chosen === undefined) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const atX = ((event.clientX - rect.left) / rect.width) * width;
      const nearest = raw.reduce((best, r) => (Math.abs(x(r.day) - atX) < Math.abs(x(best.day) - atX) ? r : best));
      if (Math.abs(x(nearest.day) - atX) > pickReach) return;
      chosen = nearest;
    }
    onPickDay(chosen.date);
  };

  // The arrow keys move the pick between weigh-ins, Home and End to the first and last (the panel's UX-3).
  const move = (event: KeyboardEvent<SVGSVGElement>) => {
    if (onPickDay === undefined || raw.length === 0) return;
    const at = raw.findIndex((r) => r.date === pickedDay);
    const from = at === -1 ? raw.length - 1 : at;
    const steps: Readonly<Record<string, number>> = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: raw.length - 1 };
    const next = steps[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const chosen = raw[Math.min(raw.length - 1, Math.max(0, next))];
    if (chosen !== undefined) onPickDay(chosen.date);
  };

  return (
    <svg
      className={`chart-plot chart-trend${onPickDay === undefined ? '' : ' chart-trend-pickable'}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      tabIndex={onPickDay === undefined ? undefined : 0}
      onClick={onPickDay === undefined ? undefined : pick}
      onKeyDown={onPickDay === undefined ? undefined : move}
    >
      {gridValues.map((value) => (
        <g key={value}>
          <line className="chart-grid" x1={left} x2={width} y1={y(value)} y2={y(value)} />
          <text className="chart-axis" x={left - 6} y={y(value) + 4} textAnchor="end">
            {toStringAsFixed(value, 0)}
          </text>
        </g>
      ))}
      {[0, rangeDays / 3, (2 * rangeDays) / 3].map((day, i) => (
        <text key={day} className="chart-axis" x={x(day)} y={height - 6} textAnchor={i === 0 ? 'start' : 'middle'}>
          {Fmt.shortDay(start.addDays(roundHalfAwayFromZero(day)))}
        </text>
      ))}
      {shaded.map(({ from, to }) => (
        <rect
          key={`cycle-${from.epochDay}`}
          className="chart-cycle"
          data-from={dayOf(from)}
          x={x(dayOf(from))}
          y={4}
          width={Math.max(2, x(dayOf(to)) - x(dayOf(from)))}
          height={plotHeight}
        />
      ))}
      {events.map((event) => (
        <line
          key={`${event.date.epochDay}-${event.type}`}
          className="chart-event"
          data-day={dayOf(event.date)}
          x1={x(dayOf(event.date))}
          x2={x(dayOf(event.date))}
          y1={4}
          y2={4 + plotHeight}
        />
      ))}
      <path className="chart-band" d={band} />
      <path className="chart-line chart-estimate" d={linePath(along(0))} strokeWidth={3} />
      {raw.map(({ day, value, date }) => {
        const picked = date === pickedDay;
        return (
          <circle
            key={day}
            className={`chart-weigh-in${picked ? ' chart-weigh-in-picked' : ''}`}
            data-day={day}
            cx={x(day)}
            cy={y(value)}
            r={picked ? 4.5 : 2.5}
          />
        );
      })}
    </svg>
  );
}
