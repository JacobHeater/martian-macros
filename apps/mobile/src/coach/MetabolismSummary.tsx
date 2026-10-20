import type { CoachSnapshot } from '../engine/CoachSnapshot';
import { TdeeEstimator } from '../engine/TdeeEstimator';
import { Fmt } from '../format/Fmt';
import { MmDisclosure } from '../ui/MmDisclosure';
import { Notice } from '../ui/Notice';
import { StatRow } from '../ui/StatRow';

const more = (count: number, what: string) => `${count} more ${what}${count === 1 ? '' : 's'}`;

interface MetabolismSummaryProps {
  snapshot: CoachSnapshot;
  calibrating: boolean;
}

/** What the coach believes the user spends in a day, and how it knows. */
export function MetabolismSummary({ snapshot, calibrating }: MetabolismSummaryProps) {
  const tdee = snapshot.tdee;
  const measured = tdee.status === 'updated';
  const estimator = new TdeeEstimator();
  const needDays = estimator.minIntakeDays - tdee.usableIntakeDays;
  const needWeighIns = estimator.minWeighIns - tdee.weighIns;
  const needs: string[] = [];
  if (needDays > 0) needs.push(more(needDays, 'fully logged day'));
  if (needWeighIns > 0) needs.push(more(needWeighIns, 'weigh-in'));
  if (needDays <= 0 && needWeighIns <= 0) needs.push(calibrating ? 'two full weeks of data' : 'a little more consistent data');
  return (
    <MmDisclosure
      remember="coach.metabolism"
      title="Your metabolism estimate"
      subtitle={
        measured && tdee.clampedToBounds
          ? 'Held at a safe limit until your logs and weight trend agree.'
          : measured
            ? 'Measured from your logged food and weight trend.'
            : tdee.settlingUntil !== undefined
              ? `Waiting for water changes to settle, until ${Fmt.longDate(tdee.settlingUntil)}.`
              : 'Starting estimate; it improves as you log food and weight.'
      }
    >
      <p className="app-text coach-range">
        Probably between {Fmt.whole(tdee.kcal - tdee.sigmaKcal)} and {Fmt.whole(tdee.kcal + tdee.sigmaKcal)} kcal a day.
      </p>
      {measured ? (
        <>
          <StatRow label="Logged days used" value={`${tdee.usableIntakeDays}`} />
          <StatRow label="Weigh-ins used" value={`${tdee.weighIns}`} />
          {tdee.excludedPartialDays > 0 ? (
            <StatRow label="Partial days left out" value={`${tdee.excludedPartialDays}`} />
          ) : null}
          {tdee.clampedToBounds ? (
            <Notice
              kind="caution"
              text={
                'Your logs and weight trend don’t add up to a plausible ' +
                'number, which usually means food is going unlogged. ' +
                'The estimate is being held at a safe limit.'
              }
            />
          ) : null}
        </>
      ) : tdee.settlingUntil !== undefined ? (
        <Notice
          icon="timer"
          text={
            'Waiting for early water changes to settle. When how much ' +
            'you eat changes, the scale moves a few pounds that are not ' +
            'fat. Your measurement will use the days after ' +
            `${Fmt.longDate(tdee.settlingUntil)}, and needs two weeks of them.`
          }
        />
      ) : (
        <>
          <p className="app-text">
            Starting estimate from your sex, age, height, weight, daily activity and training days. It gets replaced by
            a measurement of your body.
          </p>
          <Notice icon="timer" text={`Needs ${needs.join(' and ')} before your first measurement.`} />
        </>
      )}
    </MmDisclosure>
  );
}
