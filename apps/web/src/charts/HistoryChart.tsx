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
  const values = series.flatMap((item) => recorded(item).map(([, value]) => value));
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
      const value = item.values.get(start.addDays(i));
      return value === undefined ? undefined : ([x(i), y(value)] as const);
    });
  };

  const label =
    `${unit} history, ${Fmt.shortDay(start)} to ${Fmt.shortDay(today)}. ` +
    series.map((item) => `${item.label}: ${recorded(item).length} recorded points`).join('. ');

  return (
    <div className="chart">
      <div className="chart-legend" aria-hidden="true">
        {series.map((item) => (
          <span key={item.label} className={`chart-${item.kind}`}>
            {item.dashed === true ? '– –' : '●'} {item.label}
          </span>
        ))}
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
            </g>
          );
        })}
      </svg>
    </div>
  );
}
