import { Meal } from '../domain/Meal';
import { mealLabel } from '../format/mealLabel';
import { MmChoiceChip } from '../ui/MmChoiceChip';

/** Which meal an entry belongs to, as one chip for each. */
export function MealChips({ meal, onChange }: { meal: Meal; onChange: (meal: Meal) => void }) {
  return (
    <div className="app-row" role="group" aria-label="Meal">
      {Meal.values.map((choice) => (
        <MmChoiceChip key={choice} label={mealLabel(choice)} selected={meal === choice} onSelect={() => onChange(choice)} />
      ))}
    </div>
  );
}
