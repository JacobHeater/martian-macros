import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import type { HistorySeries } from './HistorySeries';
import { linePath } from './linePath';
import './charts.css';

interface HistoryChartProps {
  series: readonly HistorySeries[];
  today: CalendarDate;
  days: number;
  unit: string;
  minimum?: number | undefined;
  maximum?: number | undefined;
}

const width = 320;
const height = 178;
const left = 42;
const bottom = 28;
const plotWidth = width - left - 4;
const plotHeight = height - bottom - 4;

/** Missing dates break lines rather than representing zero observations. */
export function HistoryChart({ series, today, days, unit, minimum, maximum }: HistoryChartProps) {
  const start = today.addDays(1 - days);
  const inRange = (date: CalendarDate) => !date.isBefore(start) && !date.isAfter(today);
  const recorded = (item: HistorySeries) =>
    [...item.values].filter(([date]) => inRange(date)).sort((a, b) => a[0].compareTo(b[0]));
  // The scale is the finished days': a day still being logged does not squash them (MM-335).
  const values = series.flatMap((item) =>
    recorded(item)
      .filter(([date]) => date !== item.unfinished)
      .map(([, value]) => value),
  );
  if (values.length === 0) return <p className="chart-empty">No records in this range yet.</p>;

  const low = minimum ?? Math.max(0, Math.min(...values) * 0.85);
  const high = maximum ?? Math.max(low + 1, Math.max(...values) * 1.1);
  const interval = (high - low) / 3;
  const x = (day: number) => left + (days <= 1 ? plotWidth / 2 : (day / (days - 1)) * plotWidth);
  const y = (value: number) => 4 + plotHeight - ((value - low) / (high - low)) * plotHeight;

  const points = (item: HistorySeries): (readonly [number, number] | undefined)[] => {
    if (item.connectRecordedPoints === true) {
      const entries = recorded(item);
      return entries.flatMap(([date, value], i) => {
        const previous = entries[i - 1];
        const broken =
          previous !== undefined && item.maximumGapDays !== undefined && previous[0].daysUntil(date) > item.maximumGapDays;
        const point = [x(start.daysUntil(date)), y(value)] as const;
        return broken ? [undefined, point] : [point];
      });
    }
    return Array.from({ length: days }, (_, i) => {
      const date = start.addDays(i);
      const value = item.values.get(date);
      return value === undefined || date === item.unfinished ? undefined : ([x(i), y(value)] as const);
    });
  };

  /** What a day still being logged holds so far, if it is in range and recorded. */
  const sofar = (item: HistorySeries): number | undefined =>
    item.unfinished === undefined || !inRange(item.unfinished) ? undefined : item.values.get(item.unfinished);
  /** Its open dot, where it falls inside the finished days' scale; outside it, the legend says the value. */
  const unfinished = (item: HistorySeries): readonly [number, number] | undefined => {
    const value = sofar(item);
    if (item.unfinished === undefined || value === undefined || value < low || value > high) return undefined;
    return [x(start.daysUntil(item.unfinished)), y(value)];
  };
  const todays = series.map(sofar).find((value) => value !== undefined);
  const stillLogged = todays !== undefined;
  const offScale = series.some((item) => sofar(item) !== undefined && unfinished(item) === undefined);

  // Spoken as it is seen: each line's lowest and highest finished day, and today so far (MM-176).
  const spread = (item: HistorySeries): string => {
    const finished = recorded(item)
      .filter(([date]) => date !== item.unfinished)
      .map(([, value]) => value);
    if (finished.length === 0) return '';
    const lowest = Math.min(...finished);
    const highest = Math.max(...finished);
    return lowest === highest
      ? `, at ${Fmt.whole(lowest)}`
      : `, lowest ${Fmt.whole(lowest)}, highest ${Fmt.whole(highest)}`;
  };
  const label =
    `${unit} history, ${Fmt.shortDay(start)} to ${Fmt.shortDay(today)}. ` +
    series.map((item) => `${item.label}: ${recorded(item).length} recorded points${spread(item)}`).join('. ') +
    (stillLogged ? `. Today so far: ${Fmt.whole(todays)} ${unit}, still being logged.` : '');

  return (
    <div className="chart">
      <div className="chart-legend" aria-hidden="true">
        {series.map((item) => (
          <span key={item.label}>
            <span className={`chart-${item.kind}`}>{item.dashed === true ? '– –' : '●'}</span> {item.label}
          </span>
        ))}
        {stillLogged ? (
          <span className="chart-unfinished-key">
            ○ Today so far{offScale ? `, ${Fmt.whole(todays)} ${unit}` : ''}
          </span>
        ) : null}
      </div>
      <svg className="chart-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <text className="chart-axis" x={0} y={10}>
          {unit}
        </text>
        {[0, 1, 2, 3].map((step) => {
          const value = low + interval * step;
          return (
            <g key={step}>
              <line className="chart-grid" x1={left} x2={width - 4} y1={y(value)} y2={y(value)} />
              {step === 0 || step === 3 ? null : (
                <text className="chart-axis" x={left - 6} y={y(value) + 4} textAnchor="end">
                  {Fmt.whole(value)}
                </text>
              )}
            </g>
          );
        })}
        {[0, (days - 1) / 2, days - 1].map((day, i) => (
          <text
            key={day}
            className="chart-axis"
            x={x(day)}
            y={height - 8}
            textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
          >
            {Fmt.shortDay(start.addDays(roundHalfAwayFromZero(day)))}
          </text>
        ))}
        {series.map((item) => {
          const drawn = points(item);
          const open = unfinished(item);
          return (
            <g key={item.label} className={`chart-${item.kind}`}>
              <path
                className="chart-line"
                d={linePath(drawn)}
                strokeWidth={item.dashed === true ? 1.5 : 2.5}
                strokeDasharray={item.dashed === true ? '4 4' : undefined}
              />
              {item.dashed === true
                ? null
                : drawn.map((point, i) =>
                    point === undefined ? null : <circle key={i} className="chart-dot" cx={point[0]} cy={point[1]} r={3} />,
                  )}
              {open === undefined ? null : (
                <circle className="chart-dot chart-dot-unfinished" cx={open[0]} cy={open[1]} r={4} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
