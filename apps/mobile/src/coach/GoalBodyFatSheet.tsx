import { useState } from 'react';
import type { BiologicalSex } from '../domain/BiologicalSex';
import type { GoalBodyFat } from '../domain/GoalBodyFat';
import { PhaseRule } from '../engine/PhaseRule';
import { SafetyBounds } from '../engine/SafetyBounds';
import { goalBodyFatCheckText } from '../format/goalBodyFatCheckText';
import { parseNumber } from '../format/parseNumber';
import { quantityText } from '../format/quantityText';
import { MmButton } from '../ui/MmButton';
import { MmTextField } from '../ui/MmTextField';

interface GoalBodyFatSheetProps {
  sex: BiologicalSex;
  /** The goal in force, if one was set. */
  current: GoalBodyFat | undefined;
  /** Called with the goal to set, or 'default' to go back to the plan's own line. */
  onDone: (answer: number | 'default') => void;
}

/**
 * Sets the body fat a cut runs to (MM-36, MM-507), with the reason under it
 * as it is typed: refused under the hard floor and not stored; under the
 * soft floor stored with its warning and time limit. Built like the pace
 * sheets beside it (MM-128, MM-480): a headline, what it means, the choice.
 */
export function GoalBodyFatSheet({ sex, current, onDone }: GoalBodyFatSheetProps) {
  const [typed, setTyped] = useState(current === undefined ? '' : quantityText(current.percent));
  const line = PhaseRule.cutGoalPercent(sex);
  const percent = parseNumber(typed);
  const valid = percent !== undefined && percent > 0 && percent < 100;
  const check = valid ? SafetyBounds.checkGoalBodyFat(sex, percent) : undefined;
  const reason = valid ? goalBodyFatCheckText(sex, percent) : undefined;
  return (
    <div className="coach-sheet">
      <h2 className="app-headline">Goal body fat</h2>
      <p className="app-text">
        The body fat a cut runs to, read against the low end of your range. Without one, the plan uses {line}%.
      </p>
      <MmTextField
        label="Goal body fat"
        kind="number"
        suffix="%"
        value={typed}
        onChange={setTyped}
        error={check === 'rejected' ? reason : typed.trim() !== '' && !valid ? 'Enter a percentage above 0 and under 100.' : undefined}
        helper={check === 'warnAndTimeLimit' ? reason : undefined}
        helperIsWarning={check === 'warnAndTimeLimit'}
      />
      <div className="app-gap-small" />
      <MmButton
        label="Set goal"
        expand
        onPress={valid && check !== 'rejected' && percent !== undefined ? () => onDone(percent) : undefined}
      />
      {current === undefined ? null : (
        <MmButton label={`Use the plan’s ${line}%`} kind="text" onPress={() => onDone('default')} />
      )}
    </div>
  );
}
