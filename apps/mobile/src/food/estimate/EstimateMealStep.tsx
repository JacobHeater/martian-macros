import { useState, useId } from 'react';
import { MacroSplitChart } from '../../charts/MacroSplitChart';
import { useNetCarbs } from '../useNetCarbs';
import type { CalendarDate } from '../../domain/CalendarDate';
import { estimateMeal } from '../../domain/food/estimate/estimateMeal';
import { MealKind } from '../../domain/food/estimate/MealKind';
import { mealKcal } from '../../domain/food/estimate/mealKcal';
import { MealSize } from '../../domain/food/estimate/MealSize';
import { FoodEntry } from '../../domain/FoodEntry';
import { IntakeDay } from '../../domain/IntakeDay';
import type { Meal } from '../../domain/Meal';
import { Fmt } from '../../format/Fmt';
import { mealKindLabel } from '../../format/mealKindLabel';
import { mealKindShortLabel } from '../../format/mealKindShortLabel';
import { mealSizeLabel } from '../../format/mealSizeLabel';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { MmButton } from '../../ui/MmButton';
import { MmChoiceChip } from '../../ui/MmChoiceChip';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
import { eatenAtWhenLogged } from '../eatenAtWhenLogged';
import { MealChips } from '../MealChips';
import { TimeEatenRow } from '../TimeEatenRow';
import '../food.css';

interface EstimateMealStepProps {
  day: CalendarDate;
  meal: Meal;
  onBack: () => void;
  /** Called once the estimate is logged. */
  onDone: () => void;
  /** The typed form, offered when there is nothing to estimate from yet (MM-220). */
  onManual: () => void;
  initialSize?: MealSize;
}

/**
 * Log a meal that cannot be weighed or searched: how big, and what kind
 * (MM-150). It makes an ordinary entry measured by estimate, with the
 * uncertainty that carries.
 */
export function EstimateMealStep({ day, meal: firstMeal, onBack, onDone, onManual, initialSize = 'regular' }: EstimateMealStepProps) {
  const ids = useId();
  const { services, state } = useApp();
  const maintenance = useCell(state.coach)?.tdee.kcal;
  const netCarbs = useNetCarbs();
  const [name, setName] = useState('');
  const [size, setSize] = useState<MealSize>(initialSize);
  const [kind, setKind] = useState<MealKind>('balanced');
  const [meal, setMeal] = useState(firstMeal);
  // Logged for today, it starts at now; for another day, it has no time until one is given (MM-570).
  const [eatenAt, setEatenAt] = useState<number | undefined>(() => eatenAtWhenLogged(day, services.clock));
  /** Whether the last log failed: said above the action (MM-624). */
  const [logFailed, setLogFailed] = useState(false);
  const totals = maintenance === undefined ? undefined : estimateMeal(size, kind, { maintenanceKcal: maintenance });

  const log = async () => {
    if (totals === undefined) return;
    const typed = name.trim();
    try {
      await services.food.addFood(
        new FoodEntry({
          id: 0,
          date: day,
          meal,
          name:
            typed === ''
              ? `Estimated meal (${mealSizeLabel(size).toLowerCase()}, ${mealKindShortLabel(kind).toLowerCase()})`
              : typed,
          kcal: totals.kcal,
          proteinG: totals.proteinG,
          carbsG: totals.carbsG,
          fatG: totals.fatG,
          source: 'quickAdd',
          portion: { method: 'quickAdd', basis: 'enteredTotals' },
          eatenAt,
        }),
      );
    } catch {
      // A failure is said, never swallowed (MM-624): nothing is logged, and the step stays to try again.
      setLogFailed(true);
      return;
    }
    onDone();
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">Estimate a meal</h2>
      <p className="app-caption">
        For a restaurant, a friend’s cooking or a buffet. Restaurant meals usually have more than they look. A rough
        entry beats a missing one.
      </p>
      {maintenance === undefined ? (
        // Nothing to estimate from yet: the one thing that can be done is offered, and the rest is not drawn (MM-220).
        <>
          <Notice
            text={
              'Sizes are scaled to your own energy needs, which the app ' +
              'works out after your first weigh-in. Until then, enter a rough guess by hand: ' +
              'choose "Estimated totals" and type the calories you think it had.'
            }
          />
          <div className="app-gap" />
          <MmButton label="Enter manually" kind="secondary" expand onPress={onManual} />
          <MmButton label="Back" kind="text" onPress={onBack} />
        </>
      ) : null}
      {maintenance === undefined ? null : (
      <>
      {/* When it was eaten comes first, before what and how much (MM-576). */}
      <div className="app-gap-small" />
      <MealChips meal={meal} onChange={setMeal} />
      <TimeEatenRow eatenAt={eatenAt} meal={meal} onChange={setEatenAt} />
      <p className="food-label food-label-spaced">How big was it?</p>
      {(
        <div className="app-row" role="group" aria-label="How big was it?">
          {MealSize.values.map((choice) => (
            <MmChoiceChip
              key={choice}
              label={`${mealSizeLabel(choice)} · about ${Fmt.whole(mealKcal(choice, maintenance))} kcal`}
              selected={size === choice}
              onSelect={() => setSize(choice)}
            />
          ))}
        </div>
      )}
      <p className="food-label food-label-spaced">What kind of meal?</p>
      <div className="app-row" role="group" aria-label="What kind of meal?">
        {MealKind.values.map((choice) => (
          <MmChoiceChip
            key={choice}
            label={mealKindLabel(choice)}
            selected={kind === choice}
            onSelect={() => setKind(choice)}
          />
        ))}
      </div>
      {totals === undefined ? null : (
        <>
          {/* What the estimate will record, in the sheet's one wording (MM-218). */}
          <p id={`${ids}-logs`} className="app-subhead food-totals" data-testid="estimate-totals">
            Logs about {Fmt.whole(totals.kcal)} kcal · {Fmt.whole(totals.proteinG)} g protein · {Fmt.whole(totals.carbsG)} g carbs ·{' '}
            {Fmt.whole(totals.fatG)} g fat
          </p>
          <p className="food-label food-label-spaced">Estimated macro split</p>
          <MacroSplitChart
            isPreview
            netCarbs={netCarbs}
            intake={
              new IntakeDay({
                date: day,
                kcal: totals.kcal,
                proteinG: totals.proteinG,
                carbsG: totals.carbsG,
                fatG: totals.fatG,
              })
            }
          />
        </>
      )}
      <div className="app-gap" />
      <MmTextField label="Name (optional)" hint="Thai place, usual" value={name} onChange={setName} />
      <div className="app-gap" />
      {logFailed ? <Notice icon="warning" text="The estimate could not be logged, so nothing was. Press Log the estimate to try again." /> : null}
      <MmButton label="Log the estimate" expand onPress={() => log()} describedBy={totals === undefined ? undefined : `${ids}-logs`} />
      <MmButton label="Back" kind="text" onPress={onBack} />
      </>
      )}
    </div>
  );
}
