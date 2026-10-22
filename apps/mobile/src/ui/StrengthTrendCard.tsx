import { HistoryChart } from '../charts/HistoryChart';
import type { CalendarDate } from '../domain/CalendarDate';
import type { StrengthTrend } from '../engine/StrengthTrend';
import { Fmt } from '../format/Fmt';
import { InfoCard } from './InfoCard';
import { MmButton } from './MmButton';
import './ui.css';

interface StrengthTrendCardProps {
  trend: StrengthTrend;
  fmt: Fmt;
  today: CalendarDate;
  onHistory?: (() => void) | undefined;
  showFullHistory?: boolean;
}

/** The same dated strength evidence in Progress and a lift's detail screen. */
export function StrengthTrendCard({ trend, fmt, today, onHistory, showFullHistory = false }: StrengthTrendCardProps) {
  const points = trend.points;
  const first = points[0];
  const latest = points[points.length - 1];
  const changeLabel = (weeks: number) => {
    const change = trend.changeOverDays(weeks * 7);
    return `${weeks} weeks: ${change === undefined ? 'Not enough history' : fmt.weightDelta(change)}`;
  };
  const sinceFirst = first === undefined ? 0 : first.date.daysUntil(today);
  return (
    <InfoCard title={trend.name}>
      {trend.exercise === undefined ? (
        <p className="mm-card-text">
          Exercise details were deleted. Logged sets are preserved, but estimates need the original resistance type.
        </p>
      ) : latest === undefined ? (
        <p className="mm-card-text">
          No usable estimate yet. Log a finished workout with positive resistance and at most 12 reps including reps
          in reserve. RIR 5+ is not an exact count.
        </p>
      ) : (
        <>
          <p className="mm-card-figure">{fmt.weight(latest.trendKg)}</p>
          <p className="mm-card-caption">Smoothed estimated max · {Fmt.longDate(latest.date)}</p>
          <p className="mm-card-facts">
            {[4, 12].map((weeks) => (
              <span key={weeks}>{changeLabel(weeks)}</span>
            ))}
          </p>
          <HistoryChart
            today={today}
            days={showFullHistory && sinceFirst >= 91 ? sinceFirst + 1 : 91}
            unit={fmt.weightUnit}
            series={[
              {
                label: 'Session best estimated max',
                kind: 'target',
                dashed: true,
                connectRecordedPoints: true,
                maximumGapDays: 28,
                values: new Map(points.map((point) => [point.date, fmt.weightFromKg(point.estimateKg)])),
              },
              {
                label: 'Smoothed estimated max',
                kind: 'estimate',
                connectRecordedPoints: true,
                maximumGapDays: 28,
                values: new Map(points.map((point) => [point.date, fmt.weightFromKg(point.trendKg)])),
              },
            ]}
          />
          {points.length === 1 ? (
            <p className="mm-card-text">One qualifying session. More sessions are needed for a trend.</p>
          ) : null}
        </>
      )}
      {trend.exercise?.load === 'bodyweight' ? (
        <p className="mm-card-text">
          Uses total bodyweight plus added or assisted weight. A weigh-in on or before each session, no more than 7
          days old, is required.
        </p>
      ) : null}
      <p className="mm-card-caption">
        Estimated one-rep max is a comparison tool, not a prediction of a real max. The line averages up to 3 recent
        sessions. Changes end at the latest qualifying session.
      </p>
      {onHistory === undefined ? null : <MmButton label="Session history" kind="secondary" onPress={onHistory} />}
    </InfoCard>
  );
}
