import type { CalendarDate } from '../domain/CalendarDate';
import type { GoalMode } from '../domain/GoalMode';
import type { PhasePlan } from '../engine/PhasePlan';
import { Fmt } from '../format/Fmt';
import { goalModeLabel } from '../format/goalModeLabel';
import { phaseEndText } from '../format/phaseEndText';
import { phaseNextTitle } from '../format/phaseNextTitle';
import { phaseRecommendationText } from '../format/phaseRecommendationText';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { StatRow } from '../ui/StatRow';

interface PhaseRowsProps {
  plan: PhasePlan;
  today: CalendarDate;
  onAccept: (mode: GoalMode) => void;
  onChooseAnother: () => void;
}

/**
 * The phase under the goal (MM-36): how long it has run and, at the current
 * pace, about when it ends, in the Body row's pattern (a figure with what it
 * rests on under it, MM-342). Once it has ended, the next phase with its
 * reason, asked as the maintenance drift is (MM-130): nothing changes until
 * the user takes it or chooses another.
 */
export function PhaseRows({ plan, today, onAccept, onChooseAnother }: PhaseRowsProps) {
  const recommendation = plan.recommendation;
  const end = plan.projectedEndOn;
  const endDetail = phaseEndText(plan);
  return (
    <>
      <StatRow
        label="This phase"
        value={plan.weeks === 1 ? '1 week' : `${plan.weeks} weeks`}
        detail={plan.startedOn.isBefore(today) ? `Since ${Fmt.longDate(plan.startedOn)}` : 'Started today'}
      />
      {recommendation !== undefined || end === undefined ? null : (
        <StatRow label="Projected end" value={`About ${Fmt.monthYear(end)}`} detail={endDetail} />
      )}
      {recommendation === undefined ? null : (
        <Notice
          title={phaseNextTitle(recommendation)}
          text={phaseRecommendationText(recommendation, plan.linePercent)}
          action={
            <div className="app-row">
              <MmButton
                label={`Start ${goalModeLabel(recommendation.next).toLowerCase()}`}
                kind="secondary"
                onPress={() => onAccept(recommendation.next)}
              />
              <MmButton label="Choose another" kind="text" onPress={onChooseAnother} />
            </div>
          }
        />
      )}
    </>
  );
}
