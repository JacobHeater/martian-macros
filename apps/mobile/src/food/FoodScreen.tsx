import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import type { FoodEntry } from '../domain/FoodEntry';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import { Meal } from '../domain/Meal';
import { pauseOn } from '../engine/pauseOn';
import { Loadable } from '../state/Loadable';
import { dayTargetsOn } from '../state/dayTargetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useHeldFailure } from '../app/useHeldFailure';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { useOverlays } from '../ui/useOverlays';
import { InlineNarrationProvider } from '../coach/InlineNarrationProvider';
import { AlcoholLine } from './AlcoholLine';
import { CalorieHero } from './CalorieHero';
import { LabelAccuracyNote } from './LabelAccuracyNote';
import { copyEntries } from './copyEntries';
import { entriesCopiedTo } from './entriesCopiedTo';
import { FiberLine } from './FiberLine';
import { FoodCompletenessChip } from './FoodCompletenessChip';
import { FoodCompletenessRow } from './FoodCompletenessRow';
import { FoodDayGradeRow } from './FoodDayGradeRow';
import { FoodDayMarkRow } from './FoodDayMarkRow';
import { changeTogether } from './changeTogether';
import { MealSection } from './MealSection';
import { keepRowInPlace } from './keepRowInPlace';
import type { MmAnchor } from '../ui/MmAnchor';
import { SelectionBar } from './SelectionBar';
import type { TogetherAction } from './TogetherAction';
import { useShownDay } from './useShownDay';
import { WaterSection } from './WaterSection';
import './food.css';

/**
 * The day's hero and its meals, in tiers (MM-255): the hero with its macro
 * picture, the lines that carry a message for today, the meals as sections,
 * the completeness row after the last meal, which asks about the
 * easy-to-miss foods as the day is marked complete (MM-575). The day header lives in the app bar, and the add action floats
 * over the screen.
 */
export function FoodScreen() {
  const { services, state } = useApp();
  const pausesState = useCell(state.pauses);
  // Asked again after a failure, the day stays drawn and the button keeps its place (MM-183).
  const pausesRead = useHeldFailure(pausesState, () => state.retryPauses());
  const day = useShownDay();
  const today = useCell(state.today);
  const entries = useLoaded(state.foodForDay(day)) ?? [];
  const yesterday = useLoaded(state.foodForDay(day.addDays(-1))) ?? [];
  const history = useLoaded(state.targetsHistory) ?? [];
  // The day's targets as the user shaped them then (MM-122, MM-124).
  const shapes = useLoaded(state.targetShapes) ?? [];
  const shapeLimits = useCell(state.targetShapeLimits);
  const setup = useLoaded(state.setup);
  const guide = useCell(state.maintenanceGuide);
  const overlays = useOverlays();
  /** The foods chosen to change together, by key, while choosing (MM-634); undefined when not choosing. */
  const [selected, setSelected] = useState<ReadonlySet<string>>();
  /**
   * The row choosing started from, which takes focus as a box when choosing
   * starts and as a row again when it ends (the UX guard's UX-1), for one
   * drawing only.
   */
  const [focusKey, setFocusKey] = useState<string>();
  useEffect(() => {
    if (focusKey !== undefined) setFocusKey(undefined);
  }, [focusKey]);
  const startedFrom = useRef<string | undefined>(undefined);
  /** Where the row a hold started from stood, so it stays there once every row is a box (MM-662). */
  const heldAt = useRef<number | undefined>(undefined);
  /** Starts choosing with `key` chosen (MM-634); from a hold, with the held row kept where it is (MM-662). Nothing is said: the boxes and the bar say it. */
  const startChoosing = (key: string, anchor?: MmAnchor) => {
    startedFrom.current = key;
    heldAt.current = anchor?.top;
    setFocusKey(key);
    setSelected(new Set([key]));
  };
  useLayoutEffect(() => {
    const top = heldAt.current;
    if (selected === undefined || top === undefined) return;
    heldAt.current = undefined;
    // The box choosing started from has the focus (its row's layout effect ran first); the row is its label.
    const row = document.activeElement?.closest('.mm-check-row');
    if (row !== null && row !== undefined) keepRowInPlace(row, top);
  }, [selected]);
  /** Stops choosing, focus back on the row it started from. */
  const stopChoosing = () => {
    setFocusKey(startedFrom.current);
    setSelected(undefined);
  };
  // Another day shown stops choosing: its foods are not the ones chosen.
  useEffect(() => setSelected(undefined), [day.epochDay]);
  /** Chooses or unchooses one row while choosing foods to change together (MM-634). */
  const toggle = (key: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  /** The foods the chosen rows stand for: a meal's row is all its foods (MM-587, MM-634). */
  const chosen = (keys: ReadonlySet<string>) =>
    entries.filter((e) => keys.has(`food:${e.id}`) || (e.loggedMeal !== undefined && keys.has(`meal:${e.loggedMeal.key}`)));
  /** The key of a row on the day: a meal's row for a food of a logged meal, the food's own otherwise (MM-634). */
  const rowKey = (food: FoodEntry) => (food.loggedMeal === undefined ? `food:${food.id}` : `meal:${food.loggedMeal.key}`);
  /** Does `action` to the chosen foods, then stops choosing (MM-634). */
  const changeChosen = async (action: TogetherAction, foods: readonly FoodEntry[]) => {
    const meals = new Set(foods.map((food) => food.meal));
    await changeTogether(services.food, overlays, {
      action,
      entries: foods,
      subject: foods.length === 1 ? '1 food' : `${foods.length} foods`,
      slot: meals.size === 1 ? foods[0]?.meal : undefined,
      day,
      today,
    });
    // The row choosing started from may have left the day (deleted, or moved to another day): then the focus goes
    // to the first row still here, never nowhere (MM-649).
    const leaves = action === 'delete' || action === 'day';
    const started = startedFrom.current;
    if (leaves && started !== undefined && foods.some((food) => rowKey(food) === started)) {
      const remaining = entries.find((entry) => !foods.includes(entry));
      startedFrom.current = remaining === undefined ? undefined : rowKey(remaining);
    }
    stopChoosing();
  };
  /** Copies yesterday's food to the day shown and says so with Undo (MM-633); the button is pressed once (MM-624). */
  const copyYesterday = async () => {
    try {
      const ids = await copyEntries(services.food, entriesCopiedTo(day, yesterday));
      overlays.snack("Copied yesterday's food", { label: 'Undo', onAction: () => void services.food.applyFoodChanges({ delete: ids }) });
    } catch {
      overlays.snack("Yesterday's food could not be copied, so nothing was.");
    }
  };

  // Pauses that cannot be read take out only what they decide: the day is drawn without them (MM-334).
  const pausesFailed = pausesRead.failed;
  if (!pausesState.ready && !pausesFailed) return <ScreenLoading />;

  const targetsAllowed =
    setup !== undefined &&
    CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }).targetsAllowed;
  // Without the pauses, the day may be paused: no targets are shown as though it were not (MM-183).
  const targets = pausesFailed ? undefined : dayTargetsOn({ history, day, shapes, limits: shapeLimits, targetsAllowed });
  // On a paused day the targets are a maintenance guide (MM-148).
  const paused = pauseOn(Loadable.valueOf(pausesState) ?? [], day) !== undefined;
  const intake = intakeDayFrom(day, entries);

  return (
    <>
      {pausesFailed ? (
        <ReadFailedNotice
          title="Could not check whether this day is paused"
          consequence="This day’s targets are not shown until it can."
          onRetry={pausesRead.retry}
          pending={pausesRead.pending}
        />
      ) : null}
      <CalorieHero
        intake={intake}
        entries={entries}
        microsOffered
        targets={paused ? guide : targets}
        paused={paused}
        // The day's completeness at the hero's top right (MM-692) for any day up to today; the row after the meals changes it.
        mark={day.isAfter(today) ? undefined : <FoodCompletenessChip day={day} />}
        lines={
          // The day's fiber and alcohol belong where the day's energy is, inside the hero (MM-336).
          <>
            <FiberLine entries={entries} kcalTarget={targets?.kcal} sex={setup?.profile.sex} />
            <AlcoholLine entries={entries} />
          </>
        }
      />
      {/* Once, under the figures, until dismissed (MM-123): close is as good as exact. */}
      {targets === undefined || paused ? null : <LabelAccuracyNote />}
      {entries.length === 0 && yesterday.length > 0 && selected === undefined ? (
        <div className="app-stack-item">
          <MmButton
            label="Copy yesterday"
            kind="secondary"
            icon="copy"
            expand
            onPress={() => copyYesterday()}
          />
        </div>
      ) : null}
      {/* The lines under the foods in the model's words, asked once for the day (MM-687). */}
      <InlineNarrationProvider day={day}>
        {Meal.values.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            day={day}
            entries={entries.filter((e) => e.meal === meal)}
            selection={selected === undefined ? undefined : { selected, toggle }}
            onStartSelection={startChoosing}
            focusKey={focusKey}
          />
        ))}
      </InlineNarrationProvider>
      <WaterSection day={day} />
      {/* The day's rows: completeness and its grade once anything is logged; its Refeed or Day off for any day up to
          today, with or without entries (MM-611, MM-655: a day off may have nothing logged). */}
      {entries.length === 0 && day.isAfter(today) ? null : (
        <div className="food-complete-row">
          {entries.length === 0 ? null : (
            <>
              <FoodCompletenessRow day={day} entries={entries} />
              <FoodDayGradeRow entries={entries} />
            </>
          )}
          <FoodDayMarkRow day={day} />
        </div>
      )}
      {/* Last, so it is held in view at the foot while everything above it scrolls (MM-634). */}
      {selected === undefined ? null : (
        <SelectionBar
          entries={chosen(selected)}
          onAction={(action) => changeChosen(action, chosen(selected))}
          onDone={stopChoosing}
        />
      )}
    </>
  );
}
