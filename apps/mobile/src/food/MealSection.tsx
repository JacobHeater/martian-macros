import { FoodEntryInsight } from '../coach/FoodEntryInsight';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfFoodEntry } from '../engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../engine/gradeOfMeal';
import type { CalendarDate } from '../domain/CalendarDate';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import { mealHasSolidProtein } from '../engine/mealHasSolidProtein';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmIcon } from '../ui/MmIcon';
import { MmIconButton } from '../ui/MmIconButton';
import { MmMenuButton } from '../ui/MmMenuButton';
import { MmPressable } from '../ui/MmPressable';
import { MmSection } from '../ui/MmSection';
import { MmSwipeToRemove } from '../ui/MmSwipeToRemove';
import { useOverlays } from '../ui/useOverlays';
import { copyEntries } from './copyEntries';
import { entriesCopiedTo } from './entriesCopiedTo';
import { FoodEntryTile } from './FoodEntryTile';
import { foodEntryLinesId } from './foodEntryLinesId';
import { FoodGrade } from './FoodGrade';
import { mealIcon } from './mealIcon';
import { showAddFoodSheet } from './showAddFoodSheet';
import './food.css';

interface MealSectionProps {
  meal: Meal;
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

/**
 * One meal as a section (MM-255): its icon, its name, its subtotal and an
 * add button in the header, its entries as rows beneath. A meal with no
 * entries still shows its header, so every meal is an add target and the
 * list never jumps. The header opens and closes the entries; its actions
 * are beside it, not inside it, so pressing one never toggles the meal.
 * Swiping an entry away is an accelerator for deleting it.
 */
export function MealSection({ meal, day, entries }: MealSectionProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const total = entries.reduce((sum, e) => sum + e.kcal, 0);
  const protein = entries.reduce((sum, e) => sum + e.proteinG, 0);
  const hand = useCell(state.handSize);
  // Full detail shows the protein of the meal and a quiet marker when it
  // is a solid serving for the reference weight (MM-125). There is no
  // per-meal target.
  const full = DetailLevel.showsExtras(useLoaded(state.detailLevel) ?? 'standard');
  const weightKg = useCell(state.coach)?.trendWeightKg;
  const solid =
    full &&
    weightKg !== undefined &&
    hand !== undefined &&
    mealHasSolidProtein({ proteinG: protein, weightKg, heightCm: hand.heightCm });
  const label = mealLabel(meal);
  // Grades (MM-370) and the coach's lines (MM-362): none in the app until they are built.
  const preview = useInsightPreview();
  // Each entry's grade and the meal's (MM-370), unless a design story hands in its own.
  const gradeOf = (entry: FoodEntry) => preview.entryGrades?.get(entry.name) ?? gradeOfFoodEntry(entry, { hand });
  const mealGrade = preview.mealGrades?.get(meal) ?? gradeOfMeal(entries.map((entry) => ({ kcal: entry.kcal, grade: gradeOf(entry) })), 'meal');

  /** Deletes `entry` and offers to put it back for a few seconds (MM-48). */
  const remove = (entry: FoodEntry) => {
    void services.food.deleteFood(entry.id);
    overlays.snack(`Removed ${entry.name}`, {
      label: 'Undo',
      onAction: () => void services.food.addFood(entry),
    });
  };

  return (
    <MmSection
      icon={mealIcon(meal)}
      title={label}
      summary={
        entries.length === 0 ? undefined : (
          <span className="food-meal-total">
            {full ? `${Fmt.kcal(total)} · ${Fmt.grams(protein)} protein` : Fmt.kcal(total)}
            {solid ? (
              <span className="food-meal-marker" role="img" aria-label="A solid serving of protein">
                <MmIcon name="checkCircle" size={16} />
              </span>
            ) : null}
          </span>
        )
      }
      // An empty meal has nothing to fold, so it draws no fold (MM-389).
      collapsible={entries.length > 0}
      maintainState
      remember={`food.meal.${meal}`}
      trailing={
        <>
          {mealGrade === undefined || entries.length === 0 ? null : <FoodGrade grade={mealGrade} subject={label} scope="meal" />}
          {entries.length > 0 && day !== today ? (
            <MmIconButton
              icon="copy"
              label={`Copy ${label.toLowerCase()} to today`}
              onPress={() => void copyEntries(services.food, entriesCopiedTo(today, entries))}
            />
          ) : null}
          <MmIconButton
            icon="plus"
            kind="add"
            label={`Add food to ${label.toLowerCase()}`}
            onPress={() => void showAddFoodSheet(overlays, day, { meal })}
          />
        </>
      }
    >
      {entries.map((entry) => {
        const grade = gradeOf(entry);
        const note = preview.entryNotes?.get(entry.name);
        return (
          <MmSwipeToRemove key={entry.id} onRemove={() => remove(entry)}>
            <div className="food-meal-entry">
              <div className="food-entry-open">
                <MmPressable
                  label={`Edit ${entry.name}`}
                  describedBy={foodEntryLinesId(entry)}
                  onPress={() => void showAddFoodSheet(overlays, day, { entry })}
                >
                  <FoodEntryTile entry={entry} />
                </MmPressable>
              </div>
              {grade === undefined ? null : <FoodGrade grade={grade} subject={entry.name} />}
              <MmMenuButton<string>
                icon="more"
                label={`More actions for ${entry.name}`}
                items={[{ value: 'delete', label: 'Delete' }]}
                onSelect={(action) => {
                  if (action === 'delete') remove(entry);
                }}
              />
            </div>
            {/* The coach's line travels with its entry when it is swiped (MM-362). */}
            <FoodEntryInsight entry={entry} preview={note} />
          </MmSwipeToRemove>
        );
      })}
    </MmSection>
  );
}
