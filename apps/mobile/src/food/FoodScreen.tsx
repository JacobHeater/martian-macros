import { CoachingPolicy } from '../domain/CoachingPolicy';
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
import { MmDisclosure } from '../ui/MmDisclosure';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { AlcoholLine } from './AlcoholLine';
import { CalorieHero } from './CalorieHero';
import { LabelAccuracyNote } from './LabelAccuracyNote';
import { copyEntries } from './copyEntries';
import { EasyToMissLine } from './EasyToMissLine';
import { entriesCopiedTo } from './entriesCopiedTo';
import { FiberLine } from './FiberLine';
import { FoodCompletenessRow } from './FoodCompletenessRow';
import { FoodDayGradeRow } from './FoodDayGradeRow';
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
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';

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
            <FoodDayGradeRow entries={entries} />
          </div>
          {completeness === 'complete' ? <EasyToMissLine day={day} /> : null}
          <MmDisclosure title="More about this day" remember="food.more">
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
    </>
  );
}
