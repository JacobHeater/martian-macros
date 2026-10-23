import { Fragment, useState } from 'react';
import { MacroSplitChart } from '../../charts/MacroSplitChart';
import type { CalendarDate } from '../../domain/CalendarDate';
import { entryOfMealItem } from '../../domain/food/meal/entryOfMealItem';
import { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import { mealItemOfEntry } from '../../domain/food/meal/mealItemOfEntry';
import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import type { FoodEntry } from '../../domain/FoodEntry';
import { IntakeDay } from '../../domain/IntakeDay';
import type { Meal } from '../../domain/Meal';
import { Fmt } from '../../format/Fmt';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useLoaded } from '../../app/useLoaded';
import { DayStepper } from '../../ui/DayStepper';
import { MmButton } from '../../ui/MmButton';
import { MmTextField } from '../../ui/MmTextField';
import { useOverlays } from '../../ui/useOverlays';
import { MealChips } from '../MealChips';
import { useNetCarbs } from '../useNetCarbs';
import { gradeOfLoggedMeal } from './gradeOfLoggedMeal';
import { MealGradeRow } from './MealGradeRow';
import { MealItemForm } from './MealItemForm';
import { MealItemRow } from './MealItemRow';
import { recipeOfMeal } from './recipeOfMeal';
import { removeMeal } from './removeMeal';
import '../food.css';

interface ViewMealSheetProps {
  day: CalendarDate;
  mealKey: string;
  onDone: () => void;
}

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * A logged meal opened to its foods (MM-587): each with its amount, numbers,
 * grade and where its numbers came from, and the meal's totals and grade.
 * Every change is saved as it is made, to the foods themselves: a food
 * changed, removed or added, the meal renamed, or moved to another slot or
 * day. It reads the log, so it shows what is saved, its macro split
 * included (MM-597).
 */
export function ViewMealSheet({ day: firstDay, mealKey, onDone }: ViewMealSheetProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const hand = useCell(state.handSize);
  const netCarbs = useNetCarbs();
  const [day, setDay] = useState(firstDay);
  const entries = useLoaded(state.foodForDay(day));
  const [editing, setEditing] = useState<number | 'new'>();
  const [name, setName] = useState<string>();
  const items = (entries ?? []).filter((entry) => entry.loggedMeal?.key === mealKey);
  if (entries === undefined) return null;
  if (items.length === 0) {
    return (
      <div className="food-sheet">
        <h2 className="app-headline">View meal</h2>
        <p className="app-caption">This meal is no longer in the log.</p>
      </div>
    );
  }
  const loggedMeal = new LoggedMeal(items);
  const tag = { key: loggedMeal.key, name: loggedMeal.name };
  const grade = gradeOfLoggedMeal(loggedMeal, { hand });

  /** Every food of the meal, changed alike. */
  const updateAll = async (change: (item: FoodEntry) => FoodEntry) => {
    for (const item of loggedMeal.items) await services.food.updateFood(change(item));
  };
  const rename = async () => {
    const typed = (name ?? loggedMeal.name).trim();
    setName(undefined);
    if (typed === '' || typed === loggedMeal.name) return;
    await updateAll((item) => item.copyWith({ loggedMeal: { key: loggedMeal.key, name: typed } }));
  };
  const moveToSlot = (meal: Meal) => void updateAll((item) => item.copyWith({ meal }));
  // A time eaten belongs to its day (MM-570): moved to another day, the meal has none until one is given.
  const moveToDay = async (to: CalendarDate) => {
    await updateAll((item) => item.copyWith({ date: to, eatenAt: undefined }));
    setDay(to);
  };
  const save = async (entry: FoodEntry, changed: MealItemDraft) => {
    await services.food.updateFood(
      entryOfMealItem(changed, { id: entry.id, date: entry.date, meal: entry.meal, eatenAt: entry.eatenAt, loggedMeal: tag }),
    );
    setEditing(undefined);
  };
  const add = async (added: MealItemDraft) => {
    await services.food.addFood(entryOfMealItem(added, { date: day, meal: loggedMeal.meal, eatenAt: loggedMeal.eatenAt, loggedMeal: tag }));
    setEditing(undefined);
  };
  const remove = async (entry: FoodEntry) => {
    if (loggedMeal.items.length === 1) {
      const sure = await overlays.confirm({
        title: 'Delete this meal?',
        message: `${entry.name} is the last food of ${loggedMeal.name}. Removing it deletes the meal.`,
        confirmLabel: 'Delete meal',
      });
      if (!sure) return;
      await removeMeal(services.food, overlays, loggedMeal);
      onDone();
      return;
    }
    await services.food.deleteFood(entry.id);
    overlays.snack(`Removed ${entry.name}`, { label: 'Undo', onAction: () => void services.food.addFood(entry) });
  };
  const saveToSaved = async () => {
    await services.customFoods.saveCustomFood(recipeOfMeal({ name: loggedMeal.name, items: loggedMeal.items.map(mealItemOfEntry) }));
    overlays.snack(`Saved ${loggedMeal.name} to Saved`);
  };
  const deleteMeal = async () => {
    await removeMeal(services.food, overlays, loggedMeal);
    onDone();
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">{loggedMeal.name}</h2>
      <p className="app-subhead food-totals">
        {`${Fmt.whole(loggedMeal.kcal)} kcal · ${whole(loggedMeal.proteinG)} g protein · ${whole(loggedMeal.carbsG)} g carbs · ` +
          `${whole(loggedMeal.fatG)} g fat`}
      </p>
      {grade === undefined ? null : <MealGradeRow grade={grade} subject={loggedMeal.name} />}
      <p className="food-label food-label-spaced">Macro split</p>
      <MacroSplitChart
        netCarbs={netCarbs}
        intake={
          new IntakeDay({
            date: day,
            kcal: loggedMeal.kcal,
            proteinG: loggedMeal.proteinG,
            carbsG: loggedMeal.carbsG,
            netCarbsG: loggedMeal.netCarbsG,
            fatG: loggedMeal.fatG,
          })
        }
      />
      <MmTextField label="Meal name" value={name ?? loggedMeal.name} onChange={setName} onBlur={() => void rename()} onSubmit={() => void rename()} />
      <p className="food-label food-label-spaced">{loggedMeal.items.length === 1 ? '1 food' : `${loggedMeal.items.length} foods`}</p>
      {loggedMeal.items.map((entry) => (
        <Fragment key={entry.id}>
          <MealItemRow item={mealItemOfEntry(entry)} onChange={() => setEditing(entry.id)} onRemove={() => void remove(entry)} />
          {editing === entry.id ? (
            <MealItemForm
              item={mealItemOfEntry(entry)}
              requireComplete
              onSave={(changed) => void save(entry, changed)}
              onCancel={() => setEditing(undefined)}
            />
          ) : null}
        </Fragment>
      ))}
      {editing === 'new' ? (
        <MealItemForm requireComplete onSave={(added) => void add(added)} onCancel={() => setEditing(undefined)} />
      ) : (
        <MmButton label="Add a food" kind="text" icon="plus" onPress={() => setEditing('new')} />
      )}
      <p className="food-label food-label-spaced">Logged in</p>
      <MealChips meal={loggedMeal.meal} onChange={moveToSlot} />
      <div className="app-gap-small" />
      <DayStepper
        name="Logged on"
        label={Fmt.day(day, today)}
        onPrevious={() => void moveToDay(day.addDays(-1))}
        onNext={day.isBefore(today) ? () => void moveToDay(day.addDays(1)) : undefined}
        onLabelPress={undefined}
      />
      <div className="app-gap" />
      <MmButton label="Save to Saved" kind="secondary" icon="history" expand onPress={() => void saveToSaved()} />
      {/* The sheet's own ✕ closes it: no second Close beside Delete meal. */}
      <MmButton label="Delete meal" kind="text" icon="delete" onPress={() => void deleteMeal()} />
    </div>
  );
}
