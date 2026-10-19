import { useState } from 'react';
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
import { MealChips } from '../MealChips';
import '../food.css';

interface EstimateMealStepProps {
  day: CalendarDate;
  meal: Meal;
  onBack: () => void;
  /** Called once the estimate is logged. */
  onDone: () => void;
  initialSize?: MealSize;
}

/**
 * Log a meal that cannot be weighed or searched: how big, and what kind
 * (MM-150). It makes an ordinary entry measured by estimate, with the
 * uncertainty that carries.
 */
export function EstimateMealStep({ day, meal: firstMeal, onBack, onDone, initialSize = 'regular' }: EstimateMealStepProps) {
  const { services, state } = useApp();
  const maintenance = useCell(state.coach)?.tdee.kcal;
  const netCarbs = useNetCarbs();
  const [name, setName] = useState('');
  const [size, setSize] = useState<MealSize>(initialSize);
  const [kind, setKind] = useState<MealKind>('balanced');
  const [meal, setMeal] = useState(firstMeal);
  const totals = maintenance === undefined ? undefined : estimateMeal(size, kind, { maintenanceKcal: maintenance });

  const log = async () => {
    if (totals === undefined) return;
    const typed = name.trim();
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
      }),
    );
    onDone();
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">Estimate a meal</h2>
      <p className="app-caption">
        For a restaurant, a friend’s cooking or a buffet. Restaurant meals usually have more than they look. A rough
        entry beats a missing one.
      </p>
      <p className="food-label food-label-spaced">How big was it?</p>
      {maintenance === undefined ? (
        <Notice
          text={
            'Sizes are scaled to your own energy needs, which the app ' +
            'works out after your first weigh-in. Until then, enter the ' +
            'food by hand.'
          }
        />
      ) : (
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
      <MealChips meal={meal} onChange={setMeal} />
      <div className="app-gap" />
      <MmButton label="Log the estimate" expand onPress={maintenance === undefined ? undefined : () => void log()} />
      <MmButton label="Back" kind="text" onPress={onBack} />
    </div>
  );
}
