import type { TargetsRecord } from '../engine/TargetsRecord';
import { displayTargets } from '../format/displayTargets';
import { explanationLineText } from '../format/explanationLineText';
import { Fmt } from '../format/Fmt';
import { MmButton } from '../ui/MmButton';
import { SectionLabel } from '../ui/SectionLabel';
import { StatRow } from '../ui/StatRow';

interface CheckInNowSheetProps {
  current: TargetsRecord;
  next: TargetsRecord;
  /** The trend weight the new targets were worked out from; undefined with the weight hidden (MM-118). */
  weightText: string | undefined;
  /** Exact figures, as the person asked (MM-123), or rounded as every screen shows them. */
  exact: boolean;
  /** True to use the new targets, false to keep the current ones. */
  onDone: (accepted: boolean) => void;
}

/** "Before → after", or the figure alone when it does not move or had none before. */
function moved(before: string | undefined, after: string): string {
  if (before === undefined) return after;
  return before === after ? `${after}, unchanged` : `${before} → ${after}`;
}

/** The pace as "Intended pace" on the Coach shows it. */
const paceText = (fraction: number) => (fraction === 0 ? 'Hold weight' : Fmt.percentPerWeek(fraction));

/**
 * A check-in the person started (MM-559): targets worked out again from the latest weigh-in, beside the
 * ones in force, with why they differ: the person chooses to use them or
 * keep what they have. Laid out like `TargetChangeSheet`.
 */
export function CheckInNowSheet({ current, next, weightText, exact, onDone }: CheckInNowSheetProps) {
  const before = displayTargets(current.targets, { exact });
  const after = displayTargets(next.targets, { exact });
  const lines = next.explanation?.lines ?? [];
  return (
    <div className="coach-sheet">
      <h2 className="app-headline">Check in</h2>
      <p className="app-text">
        {weightText === undefined
          ? 'Worked out now from your latest weigh-in and your expenditure estimate'
          : `Worked out now from your trend weight of ${weightText} and your expenditure estimate`}
        {` of about ${Fmt.kcal(next.tdeeKcal)} a day.`}
      </p>
      <div className="app-gap-small" />
      <SectionLabel text="What would change" />
      <StatRow label="Calories" value={moved(Fmt.kcal(before.kcal), Fmt.kcal(after.kcal))} />
      {after.proteinMinimumG === undefined ? null : (
        <StatRow
          label="Protein minimum"
          value={moved(before.proteinMinimumG === undefined ? undefined : Fmt.grams(before.proteinMinimumG), Fmt.grams(after.proteinMinimumG))}
        />
      )}
      <StatRow label="Protein target" value={moved(Fmt.grams(before.proteinG), Fmt.grams(after.proteinG))} />
      <StatRow label="Intended pace" value={moved(paceText(before.weeklyRateFraction), paceText(after.weeklyRateFraction))} />
      {/* Why the calories moved, in the lines that add up (MM-138); none when only protein or the pace moved. */}
      {lines.length === 0 ? null : (
        <>
          <div className="app-gap-small" />
          <SectionLabel text="Why" />
          {lines.map((line, i) => (
            <p key={i} className="app-text">
              {explanationLineText(line)}
            </p>
          ))}
        </>
      )}
      <p className="app-caption">
        The weekly limit on how far targets move does not apply to a check-in you start. The safety limits still do.
      </p>
      <div className="app-gap" />
      <MmButton label="Use new targets" expand onPress={() => onDone(true)} />
      <MmButton label="Keep current targets" kind="text" onPress={() => onDone(false)} />
    </div>
  );
}
