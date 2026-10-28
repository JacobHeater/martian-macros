import type { CardioWeek } from '../engine/CardioWeek';
import { Fmt } from '../format/Fmt';
import { minutesText } from '../format/minutesText';
import './charts.css';

/**
 * The week's two cardio figures (MM-680), as `TrendStats` draws the trend
 * weight: steps a day on average and minutes of cardio, each a figure with
 * its floor and last week on the line under it. The figures carry the
 * numbers; the charts beside them carry none.
 */
export function CardioWeekFigures({ week }: { week: CardioWeek }) {
  const { current, previous, floors } = week;
  const lastSteps = previous.stepsPerDay === undefined ? 'none counted last week' : `${Fmt.whole(previous.stepsPerDay)} last week`;
  return (
    <div className="chart-stats chart-cardio-figures">
      <div className="chart-cardio-figure">
        <p className="chart-stat-figure">
          <span className="mm-visually-hidden">Steps a day </span>
          {current.stepsPerDay === undefined ? '—' : Fmt.whole(current.stepsPerDay)}
        </p>
        <p className="chart-stat-line">
          {current.stepsPerDay === undefined ? 'no steps counted' : 'steps a day'} · floor {Fmt.whole(floors.stepsPerDay)} · {lastSteps}
        </p>
      </div>
      <div className="chart-cardio-figure">
        <p className="chart-stat-figure">
          <span className="mm-visually-hidden">Cardio this week </span>
          {minutesText(current.minutes)}
        </p>
        <p className="chart-stat-line">
          of cardio · floor {minutesText(floors.minutesPerWeek)} · {minutesText(previous.minutes)} last week
        </p>
      </div>
    </div>
  );
}
