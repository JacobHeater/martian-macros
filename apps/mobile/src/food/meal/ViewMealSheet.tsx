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
import { Notice } from '../../ui/Notice';
import { useOverlays } from '../../ui/useOverlays';
import { MealChips } from '../MealChips';
import { TimeEatenRow } from '../TimeEatenRow';
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
  /** Whether the last change could not be saved (MM-624). */
  const [failed, setFailed] = useState(false);
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

  /** Runs a change to the meal; one that cannot be saved is said above the meal's foods, never swallowed (MM-624). */
  const attempt = async (work: () => Promise<void>) => {
    try {
      await work();
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };
  /** Every food of the meal, changed alike, in one step: the meal never shows in two places (MM-625). */
  const updateAll = async (change: (item: FoodEntry) => FoodEntry) => {
    await services.food.applyFoodChanges({ update: loggedMeal.items.map(change) });
  };
  const rename = async () => {
    const typed = (name ?? loggedMeal.name).trim();
    setName(undefined);
    if (typed === '' || typed === loggedMeal.name) return;
    await updateAll((item) => item.copyWith({ loggedMeal: { key: loggedMeal.key, name: typed } }));
  };
  const moveToSlot = (meal: Meal) => void attempt(() => updateAll((item) => item.copyWith({ meal })));
  // Moved to another day, the meal keeps its time eaten, as a food does (MM-570; the owner, 2026-10-26, MM-626).
  const moveToDay = async (to: CalendarDate) => {
    await updateAll((item) => item.copyWith({ date: to }));
    setDay(to);
  };
  // A meal's time is every food's, changed in one step (MM-626).
  const changeTime = (eatenAt: number) => void attempt(() => updateAll((item) => item.copyWith({ eatenAt })));
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
  /**
   * Takes one food out of the meal (MM-641): it stays in the same slot, day and time as a food of its own, with
   * its numbers and where they came from, and Undo puts it back in the meal.
   */
  const takeOut = async (entry: FoodEntry) => {
    await services.food.updateFood(entry.copyWith({ loggedMeal: undefined }));
    overlays.snack(`${entry.name} is its own food now`, {
      label: 'Undo',
      onAction: () => void services.food.updateFood(entry),
    });
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
      {failed ? <Notice icon="warning" text="That change could not be saved, so the meal is as it was. Try it again." /> : null}
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
      <MmTextField label="Meal name" value={name ?? loggedMeal.name} onChange={setName} onBlur={() => void attempt(rename)} onSubmit={() => void attempt(rename)} />
      <p className="food-label food-label-spaced">{loggedMeal.items.length === 1 ? '1 food' : `${loggedMeal.items.length} foods`}</p>
      {loggedMeal.items.map((entry) => (
        <Fragment key={entry.id}>
          <MealItemRow
            item={mealItemOfEntry(entry)}
            onChange={() => setEditing(entry.id)}
            onRemove={() => void attempt(() => remove(entry))}
            onTakeOut={() => void attempt(() => takeOut(entry))}
          />
          {editing === entry.id ? (
            <MealItemForm
              item={mealItemOfEntry(entry)}
              requireComplete
              onSave={(changed) => void attempt(() => save(entry, changed))}
              onCancel={() => setEditing(undefined)}
            />
          ) : null}
        </Fragment>
      ))}
      {editing === 'new' ? (
        <MealItemForm requireComplete onSave={(added) => void attempt(() => add(added))} onCancel={() => setEditing(undefined)} />
      ) : (
        <MmButton label="Add a food" kind="text" icon="plus" onPress={() => setEditing('new')} />
      )}
      <p className="food-label food-label-spaced">Logged in</p>
      <MealChips meal={loggedMeal.meal} onChange={moveToSlot} />
      <TimeEatenRow eatenAt={loggedMeal.eatenAt} meal={loggedMeal.meal} onChange={changeTime} />
      <div className="app-gap-small" />
      <DayStepper
        name="Logged on"
        label={Fmt.day(day, today)}
        onPrevious={() => void attempt(() => moveToDay(day.addDays(-1)))}
        onNext={day.isBefore(today) ? () => void attempt(() => moveToDay(day.addDays(1))) : undefined}
        onLabelPress={undefined}
      />
      <div className="app-gap" />
      <MmButton label="Save to Saved" kind="secondary" icon="history" expand onPress={() => attempt(saveToSaved)} />
      {/* The sheet's own ✕ closes it: no second Close beside Delete meal. */}
      <MmButton label="Delete meal" kind="text" icon="delete" onPress={() => attempt(deleteMeal)} />
    </div>
  );
}
