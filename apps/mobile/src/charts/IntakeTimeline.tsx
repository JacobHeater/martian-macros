import { useId } from 'react';
import type { IntakeStep } from '../domain/food/timeline/IntakeStep';
import type { UsualDay } from '../domain/food/timeline/UsualDay';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { minuteOfDayText } from '../format/minuteOfDayText';
import './charts.css';

interface IntakeTimelineProps {
  /** The day's running total, in the order eaten. */
  steps: readonly IntakeStep[];
  /** The line the total is read against; without one there is none. */
  targetKcal?: number | undefined;
  /** What the line is called: a target, or a guide during a pause (MM-148). */
  targetWord?: 'target' | 'guide';
  /** The zone that counts as on target (MM-123), in kcal. */
  band?: readonly [low: number, high: number] | undefined;
  /** Today's time, in minutes after midnight; a past day has none. */
  nowMinute?: number | undefined;
  /** The person's usual day (MM-572): drawn when there is enough, else its wait is said under the chart. */
  usual?: UsualDay | undefined;
}

const width = 320;
const height = 212;
const left = 6;
const right = 6;
const top = 22;
const plotBottom = 160;
const dayEnd = 24 * 60;
const ticks = [6 * 60, 12 * 60, 18 * 60, dayEnd] as const;
const tickText = (minute: number) => (minute === dayEnd ? '12 AM' : minuteOfDayText(minute).replace(':00', ''));
/** Labels closer than this, in px, would run into each other; the later one is left out. */
const labelGapPx = 36;

/**
 * The day's calories as a running total over the clock (MM-571, the owner's
 * pick of the hero's stories): a step for each time food was eaten, the
 * target as a dashed line, what went past it hatched, the moment it was
 * crossed marked, and now. A food whose time was not recorded stands at its
 * meal's usual time, drawn as an open dot. One hue throughout: it states,
 * it does not judge (MM-108). The person's usual day runs under it as a
 * dashed line; until there are enough days with meal times, the key says
 * so, with the count (owner, 2026-10-22: built now, its wait disclosed).
 */
export function IntakeTimeline({ steps, targetKcal, targetWord = 'target', band, nowMinute, usual }: IntakeTimelineProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const total = steps.at(-1)?.total ?? 0;
  const first = steps[0]?.minute ?? 6 * 60;
  const start = Math.min(6 * 60, Math.floor(first / 60) * 60);
  const end = dayEnd;
  const usualHigh = usual?.curve?.at(-1)?.[1] ?? 0;
  const high = Math.max(100, (targetKcal ?? 0) * 1.15, total * 1.08, usualHigh * 1.05);
  const x = (minute: number) => left + ((minute - start) / (end - start)) * (width - left - right);
  const y = (kcal: number) => plotBottom - (kcal / high) * (plotBottom - top);
  const until = nowMinute ?? end;

  let line = `M${x(start)} ${y(0)}`;
  for (const step of steps) line += ` H${x(step.minute)} V${y(step.total)}`;
  line += ` H${x(Math.max(until, steps.at(-1)?.minute ?? start))}`;
  const area = `${line} V${y(0)} Z`;
  const crossed = targetKcal === undefined ? undefined : steps.find((step) => step.total > targetKcal);

  // One label per meal, at its first step, and the total each meal brought the day to.
  const meals = steps.filter((step, i) => steps[i - 1]?.meal !== step.meal);
  const ends = steps.filter((step, i) => steps[i + 1]?.meal !== step.meal);
  const spaced = <T extends IntakeStep>(list: readonly T[]) =>
    list.filter((step, i, all) => {
      const before = all.slice(0, i).filter((other) => Math.abs(x(other.minute) - x(step.minute)) < labelGapPx);
      return before.length === 0;
    });

  const said = [
    steps.length === 0 ? 'Nothing logged yet.' : `${Fmt.whole(total)} kcal eaten`,
    ...ends.map((step) => `${Fmt.whole(step.total)} after ${mealLabel(step.meal).toLowerCase()}${step.approximate ? '' : ` at ${minuteOfDayText(step.minute)}`}`),
    ...(targetKcal === undefined ? [] : [`${targetWord} ${Fmt.whole(targetKcal)}`]),
    ...(crossed === undefined ? [] : [`passed at ${mealLabel(crossed.meal).toLowerCase()}`]),
  ].join(', ');

  const usualLine = usual?.curve
    ?.filter(([minute]) => minute >= start)
    .map(([minute, kcal], i) => `${i === 0 ? 'M' : 'L'}${x(minute).toFixed(1)} ${y(kcal).toFixed(1)}`)
    .join(' ');

  return (
    <div className="chart-intake-wrap">
      <svg className="chart-plot chart-intake" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Running total: ${said}.`}>
        <defs>
          <pattern id={`${id}-over`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect className="chart-intake-hatch" width="3" height="6" />
          </pattern>
          {targetKcal === undefined ? null : (
            <clipPath id={`${id}-above`}>
              <rect x={0} y={0} width={width} height={y(targetKcal)} />
            </clipPath>
          )}
        </defs>
        {ticks.map((tick) => (
          <line key={tick} className="chart-grid chart-intake-tick" x1={x(tick)} x2={x(tick)} y1={top} y2={plotBottom} />
        ))}
        <line className="chart-grid" x1={x(start)} x2={x(end)} y1={y(0)} y2={y(0)} />
        {band === undefined || targetKcal === undefined ? null : (
          <rect className="chart-intake-band" x={x(start)} width={x(end) - x(start)} y={y(band[1])} height={Math.max(0, y(band[0]) - y(band[1]))} />
        )}
        <path className="chart-intake-area" d={area} />
        {targetKcal === undefined ? null : <path d={area} fill={`url(#${id}-over)`} clipPath={`url(#${id}-above)`} />}
        {usualLine === undefined ? null : <path className="chart-intake-usual" d={usualLine} />}
        <path className="chart-intake-line" d={line} />
        {targetKcal === undefined ? null : (
          <>
            <line className="chart-intake-target" x1={x(start)} x2={x(end)} y1={y(targetKcal)} y2={y(targetKcal)} />
            <text className="chart-axis" x={x(end)} y={y(targetKcal) - 5} textAnchor="end">
              {`${targetWord} ${Fmt.whole(targetKcal)}`}
            </text>
          </>
        )}
        {steps.map((step) => (
          <circle
            key={`${step.minute}-${step.meal}-${step.approximate}`}
            className={step.approximate ? 'chart-intake-step chart-intake-step-approximate' : 'chart-intake-step'}
            cx={x(step.minute)}
            cy={y(step.total)}
            r={3.5}
          />
        ))}
        {crossed === undefined || targetKcal === undefined ? null : (
          <circle className="chart-intake-crossed" cx={x(crossed.minute)} cy={y(targetKcal)} r={5} />
        )}
        {spaced(ends).map((step) => (
          <text key={`total-${step.minute}`} className="chart-axis chart-intake-total" x={x(step.minute) + 4} y={y(step.total) - 6}>
            {Fmt.whole(step.total)}
          </text>
        ))}
        {nowMinute === undefined ? null : (
          <>
            <line className="chart-intake-now" x1={x(nowMinute)} x2={x(nowMinute)} y1={top} y2={plotBottom} />
            <text className="chart-axis chart-intake-now-text" x={x(nowMinute) + 3} y={plotBottom - 4}>
              now
            </text>
          </>
        )}
        {ticks.map((tick) => (
          <text key={`t-${tick}`} className="chart-axis" x={x(tick)} y={plotBottom + 14} textAnchor={tick === dayEnd ? 'end' : 'middle'}>
            {tickText(tick)}
          </text>
        ))}
        {spaced(meals).map((step) => (
          <text key={`m-${step.minute}`} className="chart-axis chart-intake-meal" x={x(step.minute)} y={plotBottom + 32} textAnchor="middle">
            {`${mealLabel(step.meal).charAt(0)} ${step.approximate ? '~' : ''}${minuteOfDayText(step.minute).replace(/ (AM|PM)$/, '')}`}
          </text>
        ))}
      </svg>
      {usual === undefined ? null : (
        <p className="chart-legend chart-intake-key">
          <span className="chart-intake-key-item">
            <span className="chart-intake-key-today" aria-hidden="true" />
            Today
          </span>
          {usual.curve === undefined ? (
            <span className="chart-intake-key-item chart-intake-key-waiting">
              <span className="chart-intake-key-usual" aria-hidden="true" />
              {`Your usual day appears after ${usual.needed} days with meal times · ${usual.timedDays} of ${usual.needed}`}
            </span>
          ) : (
            <span className="chart-intake-key-item">
              <span className="chart-intake-key-usual" aria-hidden="true" />
              Your usual day
            </span>
          )}
        </p>
      )}
    </div>
  );
}
