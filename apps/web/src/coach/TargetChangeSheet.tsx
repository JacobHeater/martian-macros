import type { TargetsExplanation } from '../engine/TargetsExplanation';
import type { TargetsRecord } from '../engine/TargetsRecord';
import { ExplanationLine } from '../engine/ExplanationLine';
import { confidenceLabel } from '../format/confidenceLabel';
import { explanationLineText } from '../format/explanationLineText';
import { Fmt } from '../format/Fmt';
import { whatWouldChangeIt } from '../format/whatWouldChangeIt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmButton } from '../ui/MmButton';
import { SectionLabel } from '../ui/SectionLabel';

interface TargetChangeSheetProps {
  current: TargetsRecord;
  previous: TargetsRecord | undefined;
  /**
   * Set when the user may keep last week's targets for now (a single
   * deferral of an ordinary reduction).
   */
  onHold?: (() => void) | undefined;
}

function roundingRemainder(explanation: TargetsExplanation): string | undefined {
  const change = explanation.change;
  if (change === undefined) return undefined;
  const remainder = change - explanation.linesTotal;
  if (Math.abs(remainder) < 0.5) return undefined;
  return `And ${remainder < 0 ? '−' : '+'}${Fmt.whole(Math.abs(remainder))} kcal from rounding and limits.`;
}

const same = (a: number, b: number) => roundHalfAwayFromZero(a) === roundHalfAwayFromZero(b);

function change(label: string, before: number | undefined, after: number, unit: string): string {
  if (before === undefined) return `${label} ${Fmt.whole(after)}${unit}`;
  return same(before, after) ? `${label} unchanged` : `${label} ${Fmt.whole(before)} → ${Fmt.whole(after)}${unit}`;
}

/**
 * Why a set of targets was issued, in four parts: what changed, why (lines
 * that add up), what it was based on, and what would change it (MM-138).
 */
export function TargetChangeSheet({ current, previous, onHold }: TargetChangeSheetProps) {
  const explanation = current.explanation;
  const t = current.targets;
  const p = previous?.targets;
  const confidence = explanation?.confidence;
  const remainder = explanation === undefined ? undefined : roundingRemainder(explanation);
  const confidenceNote = confidence === undefined ? '' : ` Coach confidence: ${confidenceLabel(confidence.level)}.`;
  const changes = [change('Calories', p?.kcal, t.kcal, '')];
  if (t.proteinMinimumG !== undefined) changes.push(change('Protein minimum', p?.proteinMinimumG, t.proteinMinimumG, ' g'));
  changes.push(
    change('Protein target', p?.proteinG, t.proteinG, ' g'),
    change('Carbohydrate', p?.carbsG, t.carbsG, ' g'),
    change('Fat', p?.fatG, t.fatG, ' g'),
  );
  return (
    <div className="coach-sheet">
      <h2 className="app-headline">Why your targets are what they are</h2>
      <div className="app-gap-small" />
      <SectionLabel text="What changed" />
      <p className="app-text">{changes.join('. ')}</p>
      <div className="app-gap-small" />
      <SectionLabel text="Why" />
      {explanation === undefined ? (
        <p className="app-text">{explanationLineText(new ExplanationLine('noExplanationRecorded', 0))}</p>
      ) : explanation.lines.length === 0 ? (
        <p className="app-text">No calculated contribution was large enough to move the calorie target.</p>
      ) : (
        explanation.lines.map((line, i) => (
          <p key={i} className="app-text">
            {explanationLineText(line)}
          </p>
        ))
      )}
      {remainder === undefined ? null : <p className="app-text">{remainder}</p>}
      {explanation === undefined ? null : (
        <>
          <SectionLabel text="What it was based on" />
          <p className="app-text">
            {explanation.usableIntakeDays} days of food
            {explanation.excludedPartialDays > 0 ? `, ${explanation.excludedPartialDays} left out as partial` : ''} and{' '}
            {explanation.weighIns} weigh-ins.{' '}
            {explanation.estimateStatus === 'updated'
              ? 'Your expenditure is measured.'
              : 'Your expenditure is still the starting estimate.'}
            {confidenceNote}
          </p>
          <div className="app-gap-small" />
          <SectionLabel text="What would change it" />
          <p className="app-text app-muted">{whatWouldChangeIt(explanation)}</p>
        </>
      )}
      {onHold === undefined ? null : (
        <>
          <div className="app-gap" />
          <MmButton label="Keep last week’s targets for now" kind="secondary" onPress={onHold} />
          <p className="app-caption">
            Targets stay as they are this week, and the change can come at the next check-in. You can do this once; not
            twice running.
          </p>
        </>
      )}
    </div>
  );
}
