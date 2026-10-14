import { CoachingPolicy } from '../domain/CoachingPolicy';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import { Meal } from '../domain/Meal';
import { pauseOn } from '../engine/pauseOn';
import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { targetsOn } from '../state/targetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { Notice } from '../ui/Notice';
import { CalorieHero } from './CalorieHero';
import { copyEntries } from './copyEntries';
import { EasyToMissLine } from './EasyToMissLine';
import { entriesCopiedTo } from './entriesCopiedTo';
import { FiberLine } from './FiberLine';
import { FoodCompletenessRow } from './FoodCompletenessRow';
import { MealSection } from './MealSection';
import { useShownDay } from './useShownDay';
import { WaterSection } from './WaterSection';
import './food.css';

/**
 * The day's hero and its meals, in tiers (MM-255): the hero with its macro
 * picture, the lines that carry a message for today, the meals as sections,
 * the completeness row after the last meal, and how the day is counted one
 * tap down. The day header lives in the app bar, and the add action floats
 * over the screen.
 */
export function FoodScreen() {
  const { services, state } = useApp();
  const pausesState = useCell(state.pauses);
  const day = useShownDay();
  const today = useCell(state.today);
  const entries = useLoaded(state.foodForDay(day)) ?? [];
  const yesterday = useLoaded(state.foodForDay(day.addDays(-1))) ?? [];
  const history = useLoaded(state.targetsHistory) ?? [];
  const setup = useLoaded(state.setup);
  const guide = useCell(state.maintenanceGuide);
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';

  if (Loadable.hasFailed(pausesState)) {
    return <Notice kind="caution" text="Pause history could not be loaded. Reopen the app to retry." />;
  }
  if (!pausesState.ready) return <p className="app-text app-centered">Loading pause history…</p>;

  const targetsAllowed =
    setup !== undefined &&
    CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }).targetsAllowed;
  const targets = targetsOn(history, day, { targetsAllowed });
  // On a paused day the targets are a maintenance guide (MM-148).
  const paused = pauseOn(pausesState.value, day) !== undefined;
  const intake = intakeDayFrom(day, entries);
  const alcoholKcal = entries.reduce((sum, e) => sum + e.alcoholKcal, 0);

  return (
    <>
      <CalorieHero intake={intake} entries={entries} targets={paused ? guide : targets?.targets} paused={paused} />
      <FiberLine entries={entries} kcalTarget={targets?.targets.kcal} sex={setup?.profile.sex} />
      {alcoholKcal > 0 ? <p className="app-text app-muted food-line">Alcohol: {Fmt.whole(alcoholKcal)} kcal</p> : null}
      {entries.length === 0 ? (
        <p className="app-text app-muted food-line">Nothing logged yet. Start with breakfast.</p>
      ) : null}
      {entries.length === 0 && yesterday.length > 0 ? (
        <div className="app-stack-item">
          <MmButton
            label="Copy yesterday"
            kind="secondary"
            icon="copy"
            expand
            onPress={() => void copyEntries(services.food, entriesCopiedTo(day, yesterday))}
          />
        </div>
      ) : null}
      {Meal.values.map((meal) => (
        <MealSection key={meal} meal={meal} day={day} entries={entries.filter((e) => e.meal === meal)} />
      ))}
      <WaterSection day={day} />
      {entries.length === 0 ? null : (
        <>
          <div className="food-complete-row">
            <FoodCompletenessRow day={day} entries={entries} />
          </div>
          {completeness === 'complete' ? <EasyToMissLine day={day} /> : null}
          <MmDisclosure title="More about today">
            <p className="app-caption">
              Partial days are left out of your metabolism estimate instead of being read as under-eating.
            </p>
            <p className="app-caption">
              The Split picture counts protein and carbs at 4 kcal a gram and fat at 9. Alcohol and other calorie
              differences are not part of it.
            </p>
          </MmDisclosure>
        </>
      )}
      <div className="food-fab-room" />
    </>
  );
}
