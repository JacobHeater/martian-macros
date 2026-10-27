import { FoodEntryInsight } from '../coach/FoodEntryInsight';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfFoodEntry } from '../engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../engine/gradeOfMeal';
import type { CalendarDate } from '../domain/CalendarDate';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { FoodEntry } from '../domain/FoodEntry';
import { foodLogRows } from '../domain/food/meal/foodLogRows';
import { LoggedMeal } from '../domain/food/meal/LoggedMeal';
import { Meal } from '../domain/Meal';
import { mealUsualMinute } from '../domain/mealUsualMinute';
import { mealHasSolidProtein } from '../engine/mealHasSolidProtein';
import { ProteinSpreadRule } from '../engine/ProteinSpreadRule';
import { SafetyBounds } from '../engine/SafetyBounds';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { minuteOfDayText } from '../format/minuteOfDayText';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
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
import { LoggedMealRow } from './meal/LoggedMealRow';
import { mealIcon } from './mealIcon';
import { showAddFoodSheet } from './showAddFoodSheet';
import { showMealSplitSheet } from './showMealSplitSheet';
import { SolidProteinMarker } from './SolidProteinMarker';
import { useNetCarbs } from './useNetCarbs';
import './food.css';

/** What a slot's ⋯ menu does (MM-597, MM-630). */
type SlotAction = 'split' | 'time' | 'meal' | 'day';

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
 * Swiping an entry away is an accelerator for deleting it. The header's
 * menu opens the macro split of everything in the meal (MM-597).
 */
export function MealSection({ meal, day, entries }: MealSectionProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const total = entries.reduce((sum, e) => sum + e.kcal, 0);
  const protein = entries.reduce((sum, e) => sum + e.proteinG, 0);
  const netCarbs = useNetCarbs();
  const carbs = entries.reduce((sum, e) => sum + (netCarbs ? e.netCarbsG : e.carbsG), 0);
  const fat = entries.reduce((sum, e) => sum + e.fatG, 0);
  const hand = useCell(state.handSize);
  // Full detail shows a quiet marker when the meal's protein is a solid
  // serving for the reference weight (MM-125). There is no per-meal target.
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const full = DetailLevel.showsExtras(level);
  // The meal's macros beside its calories, in the entries' own letters (MM-563); protein alone at Simple.
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const macros = DetailLevel.showsCarbsAndFat(level)
    ? `P ${whole(protein)} · C ${whole(carbs)} · F ${whole(fat)}`
    : `P ${whole(protein)}`;
  const weightKg = useCell(state.coach)?.trendWeightKg;
  const solid =
    full &&
    weightKg !== undefined &&
    hand !== undefined &&
    mealHasSolidProtein({ proteinG: protein, weightKg, heightCm: hand.heightCm });
  // The least protein that earns the marker, said when it is pressed (MM-597).
  const markerG =
    weightKg === undefined || hand === undefined
      ? undefined
      : ProteinSpreadRule.markerGPerKg * SafetyBounds.referenceWeightKg({ weightKg, heightCm: hand.heightCm });
  const label = mealLabel(meal);
  // Grades (MM-370) and the coach's lines (MM-362): none in the app until they are built.
  const preview = useInsightPreview();
  // Each entry's grade and the meal's (MM-370), unless a design story hands in its own.
  const gradeOf = (entry: FoodEntry) => preview.entryGrades?.get(entry.name) ?? gradeOfFoodEntry(entry, { hand });
  const mealGrade = preview.mealGrades?.get(meal) ?? gradeOfMeal(entries.map((entry) => ({ kcal: entry.kcal, grade: gradeOf(entry) })), 'meal');

  /**
   * Changes every food of the slot alike, in one step (MM-625), and offers to
   * put them back as they were (MM-630). Only the field chosen changes: the
   * amounts, numbers and where they came from never do.
   */
  const changeAll = async (change: (entry: FoodEntry) => FoodEntry, said: string) => {
    const before = entries;
    try {
      await services.food.applyFoodChanges({ update: entries.map(change) });
    } catch {
      overlays.snack(`${label} could not be changed, so nothing was.`);
      return;
    }
    overlays.snack(said, { label: 'Undo', onAction: () => void services.food.applyFoodChanges({ update: before }) });
  };

  /** The slot's ⋯ menu: its macro split (MM-597), or a time, meal or day for all its foods (MM-630). */
  const slotAction = async (action: SlotAction) => {
    const name = label.toLowerCase();
    const count = entries.length === 1 ? 'its food' : `all ${entries.length} foods`;
    if (action === 'split') {
      void showMealSplitSheet(overlays, day, meal, entries);
    } else if (action === 'time') {
      const times = new Set(entries.map((entry) => entry.eatenAt));
      const picked = await overlays.timeOfDay({
        // One time among them opens the clock on it; mixed or none, on the slot's usual time (MM-570).
        initialMinuteOfDay: times.size === 1 ? (entries[0]?.eatenAt ?? mealUsualMinute(meal)) : mealUsualMinute(meal),
        helpText: times.size > 1 ? `Time eaten for ${name} (now mixed)` : `Time eaten for ${name}`,
        everyMinute: true,
      });
      if (picked !== undefined) await changeAll((entry) => entry.copyWith({ eatenAt: picked }), `${label} at ${minuteOfDayText(picked)}, ${count}`);
    } else if (action === 'meal') {
      const picked = await overlays.options({
        title: `Move ${name} to`,
        options: Meal.values.filter((m) => m !== meal).map((m) => ({ value: m, label: mealLabel(m) })),
      });
      if (picked !== undefined) await changeAll((entry) => entry.copyWith({ meal: picked.value }), `Moved ${name} to ${picked.label.toLowerCase()}`);
    } else {
      const picked = await overlays.date({ helpText: `Move ${name} to`, initial: day, first: day.addDays(-365), last: today, today });
      // A food moved to another day keeps its time eaten (the owner, 2026-10-26).
      if (picked !== undefined && picked.epochDay !== day.epochDay) {
        await changeAll((entry) => entry.copyWith({ date: picked }), `Moved ${name} to ${Fmt.day(picked, today)}`);
      }
    }
  };

  /** Deletes `entry` and offers to put it back for a few seconds (MM-48). */
  const remove = (entry: FoodEntry) => {
    void services.food.deleteFood(entry.id);
    overlays.snack(`Removed ${entry.name}`, {
      label: 'Undo',
      onAction: () => void services.food.addFood(entry),
    });
  };

  return (
    // Each meal is a card, as the hero is, with its rows on the header's columns (MM-569).
    <MmSection
      framed
      flush
      icon={mealIcon(meal)}
      title={label}
      summary={
        entries.length === 0 ? undefined : (
          // Calories over macros, each line flush left, so neither wraps beside the header's actions (MM-597).
          <span className="food-meal-summary">
            <span>{Fmt.kcal(total)}</span>
            <span className="food-meal-total">
              {macros}
              {solid && markerG !== undefined ? <SolidProteinMarker proteinG={protein} thresholdG={markerG} /> : null}
            </span>
          </span>
        )
      }
      // The arrow beside the title, so the grade, add and menu leave the summary its line (MM-597).
      foldBesideTitle
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
          {entries.length === 0 ? null : (
            <MmMenuButton<SlotAction>
              icon="more"
              label={`Options for ${label.toLowerCase()}`}
              items={[
                { value: 'split', label: 'Macro split' },
                { value: 'time', label: 'Change time' },
                { value: 'meal', label: 'Move to another meal' },
                { value: 'day', label: 'Move to another day' },
              ]}
              onSelect={(action) => void slotAction(action)}
            />
          )}
        </>
      }
    >
      {/* A meal's foods are one row, where its first food was (MM-587). */}
      {foodLogRows(entries).map((row) => {
        if (row instanceof LoggedMeal) {
          const rowGrade =
            preview.entryGrades?.get(row.name) ??
            gradeOfMeal(row.items.map((item) => ({ kcal: item.kcal, grade: gradeOf(item) })), 'meal');
          return <LoggedMealRow key={`meal-${row.key}`} loggedMeal={row} day={day} grade={rowGrade} />;
        }
        const entry = row;
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
