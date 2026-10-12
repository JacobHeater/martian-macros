import { MacroSplitChart } from '../charts/MacroSplitChart';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import type { DayCompleteness } from '../domain/DayCompleteness';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import { Meal } from '../domain/Meal';
import { pauseOn } from '../engine/pauseOn';
import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { targetsOn } from '../state/targetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSurface } from '../ui/MmSurface';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { askLowDayComplete } from './askLowDayComplete';
import { CalorieHero } from './CalorieHero';
import { copyEntries } from './copyEntries';
import { EasyToMissLine } from './EasyToMissLine';
import { entriesCopiedTo } from './entriesCopiedTo';
import { FiberLine } from './FiberLine';
import { MealSection } from './MealSection';
import { useShownDay } from './useShownDay';
import './food.css';

/** The day's hero and its meals. The day header lives in the app bar, and the add action floats over the screen. */
export function FoodScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const pausesState = useCell(state.pauses);
  const day = useShownDay();
  const today = useCell(state.today);
  const entries = useLoaded(state.foodForDay(day)) ?? [];
  const yesterday = useLoaded(state.foodForDay(day.addDays(-1))) ?? [];
  const history = useLoaded(state.targetsHistory) ?? [];
  const setup = useLoaded(state.setup);
  const guide = useCell(state.maintenanceGuide);
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  const floor = useCell(state.coach)?.calorieFloorKcal;

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

  const mark = async (chosen: DayCompleteness | undefined) => {
    let next: DayCompleteness = chosen ?? 'unmarked';
    // A day under half the floor is asked about once, as it is marked (MM-114).
    const logged = entries.reduce((total, e) => total + e.kcal, 0);
    if (next === 'complete' && floor !== undefined && logged < floor / 2) {
      const answer = await askLowDayComplete(overlays, logged);
      if (answer === undefined) return;
      next = answer;
    }
    await services.dayMarks.setCompleteness(day, next);
  };

  return (
    <>
      <CalorieHero intake={intake} targets={paused ? guide : targets?.targets} paused={paused} />
      <InfoCard title="Macronutrient split">
        <MacroSplitChart intake={intake} />
      </InfoCard>
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
        <MmSurface key={meal} kind="compact" padded={false}>
          <MealSection meal={meal} day={day} entries={entries.filter((e) => e.meal === meal)} />
        </MmSurface>
      ))}
      {entries.length === 0 ? null : (
        <>
          <h2 className="app-subhead food-complete-question">Is this day fully logged?</h2>
          <MmSegmented<DayCompleteness>
            name="Is this day fully logged?"
            allowEmpty
            segments={[
              { value: 'complete', label: 'Complete' },
              { value: 'partial', label: 'Partial' },
            ]}
            selected={completeness === 'unmarked' ? undefined : completeness}
            onChange={(chosen) => void mark(chosen)}
          />
          <div className="app-gap-small" />
          {completeness === 'complete' ? <EasyToMissLine day={day} /> : null}
          <p className="app-caption">
            Partial days are left out of your metabolism estimate instead of being read as under-eating.
          </p>
        </>
      )}
      <div className="food-fab-room" />
    </>
  );
}
