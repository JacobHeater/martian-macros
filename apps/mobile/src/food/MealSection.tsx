import { useRef } from 'react';
import { FoodEntryInsight } from '../coach/FoodEntryInsight';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfFoodEntry } from '../engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../engine/gradeOfMeal';
import type { CalendarDate } from '../domain/CalendarDate';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { FoodEntry } from '../domain/FoodEntry';
import { foodLogRows } from '../domain/food/meal/foodLogRows';
import { LoggedMeal } from '../domain/food/meal/LoggedMeal';
import type { Meal } from '../domain/Meal';
import { mealHasSolidProtein } from '../engine/mealHasSolidProtein';
import { ProteinSpreadRule } from '../engine/ProteinSpreadRule';
import { SafetyBounds } from '../engine/SafetyBounds';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useNavigator } from '../app/useNavigator';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmCheckRow } from '../ui/MmCheckRow';
import { MmMenuButton } from '../ui/MmMenuButton';
import type { MmAnchor } from '../ui/MmAnchor';
import { MmPressable } from '../ui/MmPressable';
import { MmSection } from '../ui/MmSection';
import { MmSwipeToRemove } from '../ui/MmSwipeToRemove';
import { useOverlays } from '../ui/useOverlays';
import { changeTogether } from './changeTogether';
import { copyEntries } from './copyEntries';
import { entriesCopiedTo } from './entriesCopiedTo';
import { FoodEntryTile } from './FoodEntryTile';
import { foodEntryLinesId } from './foodEntryLinesId';
import { FoodGrade } from './FoodGrade';
import { LoggedMealRow } from './meal/LoggedMealRow';
import { mealIcon } from './mealIcon';
import { addFoodFrom } from './addFoodFrom';
import { showMealBreakdownSheet } from './showMealBreakdownSheet';
import { showSaveMealSheet } from './meal/showSaveMealSheet';
import { showMealSplitSheet } from './showMealSplitSheet';
import { useCopyToAnotherPhone } from './phone/useCopyToAnotherPhone';
import { SolidProteinMarker } from './SolidProteinMarker';
import type { TogetherAction } from './TogetherAction';
import { togetherActionItems } from './togetherActionItems';
import { useNetCarbs } from './useNetCarbs';
import './food.css';

/** What a slot's ⋯ menu does (MM-597, MM-630, MM-666, MM-714): its own two, every together action, and a save. */
type SlotAction = 'breakdown' | 'split' | TogetherAction | 'save';

/** What a food's ⋯ menu does (MM-634, MM-714): choosing, or any together action on this one food. */
type EntryAction = 'select' | TogetherAction;

interface MealSectionProps {
  meal: Meal;
  day: CalendarDate;
  entries: readonly FoodEntry[];
  /**
   * While foods are being chosen to change together (MM-634): what is chosen,
   * by key ("food:12", "meal:<key>"), and how to choose or unchoose one.
   */
  selection?: { readonly selected: ReadonlySet<string>; readonly toggle: (key: string) => void } | undefined;
  /** Starts choosing foods to change together, with the one keyed chosen (MM-634). */
  onStartSelection?: ((key: string, anchor?: MmAnchor) => void) | undefined;
  /**
   * The row, by key, that takes focus when drawn (MM-634): the one choosing
   * started from, as a box when choosing starts and as a row when it ends.
   */
  focusKey?: string | undefined;
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
export function MealSection({ meal, day, entries, selection, onStartSelection, focusKey }: MealSectionProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const navigator = useNavigator();
  const today = useCell(state.today);
  const copyToPhone = useCopyToAnotherPhone();
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
  /** A long press on a row: one tap under the finger, then choosing with that row ticked where it is (MM-661, MM-662). */
  const chooseByHold = (key: string, anchor: MmAnchor) => {
    services.haptics.tap();
    onStartSelection?.(key, anchor);
  };
  const mealGrade = preview.mealGrades?.get(meal) ?? gradeOfMeal(entries.map((entry) => ({ kcal: entry.kcal, grade: gradeOf(entry) })), 'meal');

  /** The slot's ⋯ menu: its macro split (MM-597), or a time, meal, day or copy for all its foods (MM-630, MM-633, MM-714). */
  const slotAction = async (action: SlotAction) => {
    if (action === 'breakdown') {
      void showMealBreakdownSheet(overlays, day, meal, entries);
      return;
    }
    if (action === 'split') {
      void showMealSplitSheet(overlays, day, meal, entries);
      return;
    }
    // Kept to log again in one press, from Saved (MM-645).
    if (action === 'save') {
      void showSaveMealSheet(overlays, entries);
      return;
    }
    await changeTogether(services.food, overlays, {
      action,
      entries,
      subject: label.toLowerCase(),
      count: entries.length === 1 ? 'its food' : `all ${entries.length} foods`,
      slot: meal,
      day,
      today,
      toPhone: (foods) => copyToPhone(day, { entries: foods }),
    });
  };

  /** A day as it reads inside a sentence: "today", "yesterday", or its date as written. */
  const dayInSentence = (to: CalendarDate) => {
    const said = Fmt.day(to, today);
    return to.epochDay >= today.epochDay - 1 ? said.toLowerCase() : said;
  };
  /** Whether a copy is being made, so a second press does not copy again (MM-633). */
  const copying = useRef(false);
  /** Copies the meal's foods to `to`, says so with Undo, once however often pressed (MM-633). */
  const copyTo = async (to: CalendarDate) => {
    if (copying.current) return;
    copying.current = true;
    const name = label.toLowerCase();
    try {
      const ids = await copyEntries(services.food, entriesCopiedTo(to, entries));
      overlays.snack(`Copied ${name} to ${dayInSentence(to)}`, {
        label: 'Undo',
        onAction: () => void services.food.applyFoodChanges({ delete: ids }),
      });
    } catch {
      overlays.snack(`${label} could not be copied, so nothing was.`);
    } finally {
      copying.current = false;
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

  /** A food's ⋯ menu (MM-714): the same actions the chosen foods have, on this one food, named by it. */
  const entryAction = (entry: FoodEntry, action: EntryAction) => {
    if (action === 'delete') remove(entry);
    // Several foods changed together: this one first (MM-634).
    else if (action === 'select') onStartSelection?.(`food:${entry.id}`);
    else
      void changeTogether(services.food, overlays, {
        action,
        entries: [entry],
        subject: entry.name,
        slot: entry.meal,
        day,
        today,
        toPhone: (foods) => copyToPhone(day, { entries: foods }),
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
        // While foods are chosen, the meal's own actions step aside for the choosing (MM-634).
        selection !== undefined ? undefined : (
        <>
          {mealGrade === undefined || entries.length === 0 ? null : <FoodGrade grade={mealGrade} subject={label} scope="meal" />}
          {entries.length > 0 && day !== today ? (
            <MmIconButton
              icon="copy"
              label={`Copy ${label.toLowerCase()} to today`}
              onPress={() => void copyTo(today)}
            />
          ) : null}
          <MmIconButton
            icon="plus"
            kind="add"
            label={`Add food to ${label.toLowerCase()}`}
            onPress={() => void addFoodFrom({ overlays, navigator }, day, { meal })}
          />
          {entries.length === 0 ? null : (
            <MmMenuButton<SlotAction>
              icon="more"
              label={`Options for ${label.toLowerCase()}`}
              // The same together actions a food's menu and the chosen foods' dialog offer (MM-714), between the slot's own.
              items={[
                { value: 'breakdown', label: 'Coach breakdown' },
                { value: 'split', label: 'Macro split' },
                ...togetherActionItems,
                { value: 'save', label: 'Save as a meal' },
              ]}
              onSelect={(action) => void slotAction(action)}
            />
          )}
        </>
        )
      }
    >
      {/* A meal's foods are one row, where its first food was (MM-587). */}
      {foodLogRows(entries).map((row) => {
        // Choosing foods to change together: each row is a box to tick, a meal as one (MM-634).
        if (selection !== undefined) {
          const key = row instanceof LoggedMeal ? `meal:${row.key}` : `food:${row.id}`;
          const title =
            row instanceof LoggedMeal
              ? `${row.name} · ${row.items.length === 1 ? '1 food' : `${row.items.length} foods`} · ${Fmt.kcal(row.kcal)}`
              : `${row.name} · ${Fmt.kcal(row.kcal)}`;
          return (
            <MmCheckRow key={key} title={title} value={selection.selected.has(key)} onChange={() => selection.toggle(key)} autoFocus={key === focusKey} />
          );
        }
        if (row instanceof LoggedMeal) {
          const rowGrade =
            preview.entryGrades?.get(row.name) ??
            gradeOfMeal(row.items.map((item) => ({ kcal: item.kcal, grade: gradeOf(item) })), 'meal');
          return (
            <LoggedMealRow
              key={`meal-${row.key}`}
              loggedMeal={row}
              day={day}
              grade={rowGrade}
              onSelect={onStartSelection === undefined ? undefined : () => onStartSelection(`meal:${row.key}`)}
              onLongPress={onStartSelection === undefined ? undefined : (anchor) => chooseByHold(`meal:${row.key}`, anchor)}
              autoFocus={`meal:${row.key}` === focusKey}
            />
          );
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
                  autoFocus={`food:${entry.id}` === focusKey}
                  onPress={() => void addFoodFrom({ overlays, navigator }, day, { entry })}
                  // A long press starts choosing with this food ticked, felt as one tap (MM-661, the owner).
                  onLongPress={onStartSelection === undefined ? undefined : (anchor) => chooseByHold(`food:${entry.id}`, anchor)}
                >
                  <FoodEntryTile entry={entry} />
                </MmPressable>
              </div>
              {grade === undefined ? null : <FoodGrade grade={grade} subject={entry.name} />}
              <MmMenuButton<EntryAction>
                icon="more"
                label={`More actions for ${entry.name}`}
                items={[...(onStartSelection === undefined ? [] : [{ value: 'select' as const, label: 'Select' }]), ...togetherActionItems]}
                onSelect={(action) => entryAction(entry, action)}
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
