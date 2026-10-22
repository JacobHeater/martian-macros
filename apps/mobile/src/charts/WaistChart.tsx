import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistObservation } from '../domain/WaistObservation';
import { waistNoiseOf } from '../engine/waistNoiseOf';
import { WaistRule } from '../engine/WaistRule';
import { Fmt } from '../format/Fmt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { linePath } from './linePath';
import './charts.css';

interface WaistChartProps {
  waist: readonly WaistObservation[];
  today: CalendarDate;
  /** 90 days or a year: a weekly measure has nothing to say over 30. */
  rangeDays: number;
  fmt: Fmt;
  /** What the chart says, for a screen reader (the chart itself is drawn). */
  label: string;
  /**
   * Another site's noise figure (MM-156), drawn in the same way; the waist's
   * own figure, the user's once there is one, when not given.
   */
  noiseCm?: number | undefined;
  /** What is said when the range holds nothing. */
  emptyText?: string;
}

const width = 320;
const height = 190;
const left = 40;
const bottom = 24;
const plotWidth = width - left - 4;
const plotHeight = height - bottom - 4;

/** The middle value of up to three measurements, as the change function smooths them. */
function middle(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.trunc(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * The waist over time, in the trend chart's language (MM-155, MM-107):
 * each measurement a dot, a line through the middle of each three
 * neighbouring entries (what the change function compares), and a band of
 * the noise figure either side of it, wider where an entry is a single
 * reading. A difference inside the band is within what a tape can tell.
 * Any other site is drawn the same way with its own noise figure (MM-156).
 */
export function WaistChart({
  waist,
  today,
  rangeDays,
  fmt,
  label,
  noiseCm,
  emptyText = 'No waist measurements in this range.',
}: WaistChartProps) {
  const start = today.addDays(1 - rangeDays);
  const all = [...waist].filter((w) => !w.date.isAfter(today)).sort((a, b) => a.date.compareTo(b.date));
  const shown = all.filter((w) => !w.date.isBefore(start));
  if (shown.length === 0) return <p className="chart-empty chart-empty-tall">{emptyText}</p>;

  const noise = noiseCm ?? waistNoiseOf(all);
  const dayOf = (date: CalendarDate) => start.daysUntil(date);
  const value = (cm: number) => fmt.lengthFromCm(cm);
  // Smoothed over the neighbours in the whole record, so the line does not bend at the range's edge.
  const smoothed = shown.map((entry) => {
    const at = all.indexOf(entry);
    const around = all.slice(Math.max(0, at - 1), at + 2);
    const single = around.some((e) => e.isSingleReading);
    const spread = noise * (single ? WaistRule.singleReadingFactor : 1);
    return { day: dayOf(entry.date), mid: middle(around.map((e) => e.waistCm)), spread };
  });
  const ys = [
    ...shown.map((w) => value(w.waistCm)),
    ...smoothed.map((s) => value(s.mid + s.spread)),
    ...smoothed.map((s) => value(s.mid - s.spread)),
  ];
  const lowest = Math.min(...ys);
  const highest = Math.max(...ys);
  const pad = Math.max((highest - lowest) * 0.1, fmt.imperial ? 0.25 : 0.5);
  const low = lowest - pad;
  const high = highest + pad;

  const x = (day: number) => left + (rangeDays <= 1 ? plotWidth / 2 : (day / (rangeDays - 1)) * plotWidth);
  const y = (v: number) => 4 + plotHeight - ((v - low) / (high - low)) * plotHeight;
  const along = (sign: number) => smoothed.map((s) => [x(s.day), y(value(s.mid + sign * s.spread))] as const);
  // Under three measurements there is no middle of three: dots alone, and the words say so (the panel's PD-8, UX-7).
  const drawn = all.length >= WaistRule.smoothedEntries && smoothed.length >= 2;
  const band = drawn ? `${linePath(along(1))}${linePath([...along(-1)].reverse()).replace('M', 'L')}Z` : '';
  const gridValues = [1, 2, 3].map((step) => low + ((high - low) / 4) * step);

  return (
    <svg className="chart-plot chart-waist" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {gridValues.map((v) => (
        <g key={v}>
          <line className="chart-grid" x1={left} x2={width - 4} y1={y(v)} y2={y(v)} />
          <text className="chart-axis" x={left - 6} y={y(v) + 4} textAnchor="end">
            {toStringAsFixed(v, 1)}
          </text>
        </g>
      ))}
      {[0, rangeDays / 3, (2 * rangeDays) / 3].map((day, i) => (
        <text key={day} className="chart-axis" x={x(day)} y={height - 6} textAnchor={i === 0 ? 'start' : 'middle'}>
          {Fmt.shortDay(start.addDays(roundHalfAwayFromZero(day)))}
        </text>
      ))}
      <g className="chart-measurement">
        {drawn ? <path className="chart-waist-band" d={band} /> : null}
        {drawn ? <path className="chart-line" d={linePath(along(0))} strokeWidth={2.5} /> : null}
        {shown.map((w) => (
          <circle key={w.date.epochDay} className="chart-dot chart-waist-entry" data-day={dayOf(w.date)} cx={x(dayOf(w.date))} cy={y(value(w.waistCm))} r={3} />
        ))}
      </g>
    </svg>
  );
}
