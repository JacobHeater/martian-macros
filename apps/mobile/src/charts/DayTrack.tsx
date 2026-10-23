import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import './charts.css';

interface DayTrackProps {
  /** The days drawn, ending today: the weight trend's range, so the two line up. */
  days: number;
  today: CalendarDate;
  /** The days marked with a dot. */
  marks: readonly CalendarDate[];
  /** Stretches shaded under the dots, as the trend chart shades them. */
  bands?: readonly { from: CalendarDate; to: CalendarDate }[];
  /** A weight event's caution, or a period day's trend colour. */
  kind: 'event' | 'period';
  /** What the track says, for a screen reader. */
  label: string;
}

const width = 320;
const height = 40;
const line = 12;

/**
 * Days on a line (MM-578): the range of the weight trend, a tick each week
 * back from today, a dot on each marked day and a shade over each band.
 * Dates as the trend chart's axis shows them, so a mark can be found on it.
 */
export function DayTrack({ days, today, marks, bands = [], kind, label }: DayTrackProps) {
  const start = today.addDays(1 - days);
  const x = (day: number) => 6 + (days <= 1 ? 0.5 : day / (days - 1)) * (width - 12);
  const at = (date: CalendarDate) => x(start.daysUntil(date));
  const inRange = (date: CalendarDate) => !date.isBefore(start) && !date.isAfter(today);
  const weeks = Array.from({ length: Math.floor((days - 1) / 7) + 1 }, (_, i) => days - 1 - i * 7);
  const shaded = bands
    .filter((band) => !band.to.isBefore(start) && !band.from.isAfter(today))
    .map((band) => ({
      from: at(band.from.isBefore(start) ? start : band.from),
      to: at(band.to.isAfter(today) ? today : band.to),
    }));
  return (
    <svg className={`chart-plot chart-track chart-track-${kind}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {shaded.map((band) => (
        <rect key={band.from} className="chart-cycle" x={band.from - 3} y={line - 8} width={band.to - band.from + 6} height={16} rx={4} />
      ))}
      <line className="chart-grid" x1={6} x2={width - 6} y1={line} y2={line} />
      {weeks.map((day) => (
        <line key={day} className="chart-grid" x1={x(day)} x2={x(day)} y1={line - 4} y2={line + 4} />
      ))}
      {marks.filter(inRange).map((date) => (
        <circle key={date.epochDay} className="chart-track-mark" cx={at(date)} cy={line} r={4.5} />
      ))}
      {[0, (days - 1) / 2, days - 1].map((day, i) => (
        <text key={day} className="chart-axis" x={x(day)} y={height - 2} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>
          {Fmt.shortDay(start.addDays(roundHalfAwayFromZero(day)))}
        </text>
      ))}
    </svg>
  );
}
