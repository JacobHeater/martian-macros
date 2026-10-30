import type { SavedMeal } from '../domain/food/meal/SavedMeal';
import { Fmt } from '../format/Fmt';
import { MmListRow } from '../ui/MmListRow';
import { MmMenuButton } from '../ui/MmMenuButton';

/**
 * A saved meal in the Library (MM-706): its name, its foods and their calories, as the Saved step says them (MM-645).
 * Its foods are logged loose, so the log cannot say how often the meal was logged; the row has no such line.
 */
export function LibraryMealRow({ meal, onDelete }: { meal: SavedMeal; onDelete: () => void }) {
  const kcal = meal.foods.reduce((sum, food) => sum + food.kcal, 0);
  return (
    <MmListRow
      title={meal.name}
      subtitle={`${meal.foods.length === 1 ? '1 food' : `${meal.foods.length} foods`} · ${Fmt.kcal(kcal)} · ${meal.foods.map((food) => food.name).join(', ')}`}
      trailingAction={
        <MmMenuButton<'delete'>
          icon="more"
          label={`More actions for ${meal.name}`}
          items={[{ value: 'delete', label: 'Delete' }]}
          onSelect={onDelete}
        />
      }
    />
  );
}
