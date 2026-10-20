import { InlineInsight } from '../coach/InlineInsight';
import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightObservation } from '../domain/WeightObservation';
import type { WeightJumpExplanation } from '../engine/WeightJumpExplanation';
import { Fmt } from '../format/Fmt';
import { weightJumpContent } from './weightJumpContent';
import './progress.css';

interface WeighInNoteProps {
  weighIn: WeightObservation;
  /** The trend on that day, when the trend has a point for it. */
  trendKg: number | undefined;
  /** Why the reading is far from the trend, or undefined when it is inside the day-to-day noise. */
  explanation: WeightJumpExplanation | undefined;
  /** Whether the person chose this reading on the chart; the latest reading needs no saying. */
  picked: boolean;
  fmt: Fmt;
  today: CalendarDate;
}

/**
 * The reading under the trend chart (MM-142): the one the person tapped,
 * said as a caption with its distance from the trend, and, when it is far
 * enough to need one, the coach's explanation as the same line the
 * Dashboard draws under the weigh-in, its figures one tap down.
 */
export function WeighInNote({ weighIn, trendKg, explanation, picked, fmt, today }: WeighInNoteProps) {
  // With an explanation beneath, the distance is its first words: the caption says the reading once (the panel's PD-2, UX-5).
  const distance =
    trendKg === undefined || explanation !== undefined
      ? ''
      : `, ${fmt.weightDelta(weighIn.weightKg - trendKg)} from the trend, inside the day-to-day noise`;
  return (
    <div className="progress-weigh-in-note">
      {picked ? (
        <p className="app-caption progress-weigh-in-picked">
          {Fmt.day(weighIn.date, today)}: {fmt.weight(weighIn.weightKg)}
          {distance}.
        </p>
      ) : null}
      {explanation === undefined ? null : <InlineInsight insight={weightJumpContent(explanation, fmt, today, 'progress')} layout="plain" />}
    </div>
  );
}
