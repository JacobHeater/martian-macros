import { MacroSplitChart } from '../charts/MacroSplitChart';
import type { FoodEntry } from '../domain/FoodEntry';
import type { IntakeDay } from '../domain/IntakeDay';
import { NutritionGoals } from '../domain/NutritionGoals';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { MacroPicture } from '../domain/MacroPicture';
import type { DailyTargets } from '../engine/DailyTargets';
import { Fmt } from '../format/Fmt';
import { clamp } from '../lang/clamp';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { HorizonArc } from '../ui/HorizonArc';
import { MacroBar } from '../ui/MacroBar';
import { MacroKind } from '../ui/MacroKind';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmListRow } from '../ui/MmListRow';
import { MmPressable } from '../ui/MmPressable';
import { MmSegmented } from '../ui/MmSegmented';
import { MicrosPanel } from './MicrosPanel';
import './food.css';

interface CalorieHeroProps {
  intake: IntakeDay;
  /** The day's foods, for the Micros picture (MM-310). */
  entries: readonly FoodEntry[];
  targets: DailyTargets | undefined;
  /**
   * During a pause `targets` are a guide (MM-148): the hero shows what was
   * logged beside it and never calls a day over.
   */
  paused?: boolean;
  /** Which macros to show; protein is always emphasized. */
  macros?: readonly MacroKind[];
  /** One line about the coach (calibration, a recent change). */
  status?: string | undefined;
  /** The coach's confidence, in a word; said with its label, never alone. */
  confidence?: string | undefined;
  onStatusPress?: (() => void) | undefined;
  /** Opens the day's detail. */
  onPress?: (() => void) | undefined;
  /** What the way into the detail is called. */
  pressLabel?: string | undefined;
}

/**
 * The hero of a day: calories as a horizon arc, what is left, one picture
 * of the macros, and optionally one status line. The one calorie visual in
 * the app (MM-187): the Dashboard, the Food screen and the Coach screen all
 * use it, and the arc is always drawn. The macro picture is a switch
 * between grams against target and the split of calories (MM-253, rule 4),
 * remembered per person, never both at once. At Full detail the switch has
 * a third choice, the day's micronutrients (MM-310).
 */
export function CalorieHero({
  intake,
  entries,
  targets,
  paused = false,
  macros = MacroKind.values,
  status,
  confidence,
  onStatusPress,
  onPress,
  pressLabel,
}: CalorieHeroProps) {
  const { services, state } = useApp();
  // Simple detail shows calories and protein only (MM-49).
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const picture = useLoaded(state.macroPicture) ?? 'bars';
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const goals = useLoaded(state.nutritionGoals) ?? NutritionGoals.none;
  const shown = DetailLevel.showsCarbsAndFat(level) ? macros : macros.filter((macro) => macro === 'protein');
  const t = targets;
  const left = t === undefined || paused ? undefined : t.kcal - intake.kcal;
  const over = left !== undefined && left < 0;
  const figure = left === undefined ? Fmt.whole(intake.kcal) : Fmt.whole(Math.abs(left));
  let caption: string;
  if (paused && t !== undefined) caption = `kcal logged · paused, guide ${Fmt.whole(t.kcal)}`;
  else if (left === undefined || t === undefined) caption = 'kcal logged';
  else caption = over ? `kcal over ${Fmt.whole(t.kcal)}` : `kcal left of ${Fmt.whole(t.kcal)}`;
  let progress = 0;
  if (t !== undefined && t.kcal > 0) progress = paused ? clamp(intake.kcal / t.kcal, 0, 1) : intake.kcal / t.kcal;

  const grams: Readonly<Record<MacroKind, number>> = { protein: intake.proteinG, carbs: intake.carbsG, fat: intake.fatG };
  const target: Readonly<Record<MacroKind, number | undefined>> = { protein: t?.proteinG, carbs: t?.carbsG, fat: t?.fatG };
  // The split of calories needs all three macros; at Simple detail only the bars are offered.
  const switchable = DetailLevel.showsCarbsAndFat(level);
  // Micros is a choice at Full detail only; remembered below it, the bars are shown.
  const micros = DetailLevel.showsExtras(level);
  const chosen: MacroPicture = !switchable || (picture === 'micros' && !micros) ? 'bars' : picture;

  return (
    <MmHeroSurface>
      <h2 className="mm-visually-hidden">Calories today</h2>
      <HorizonArc progress={progress} label={`${figure} ${caption}`} />
      {onPress === undefined ? (
        <>
          <p className="food-hero-figure">{figure}</p>
          <p className="food-hero-caption">{caption}</p>
        </>
      ) : (
        <MmPressable label={pressLabel} onPress={onPress}>
          <span className="food-hero-figure">{figure}</span>
          <span className="food-hero-caption">{caption}</span>
        </MmPressable>
      )}
      {switchable ? (
        <div className="food-hero-switch">
          <MmSegmented<MacroPicture>
            name="Macro picture"
            compact
            segments={[
              { value: 'bars', label: 'Grams' },
              { value: 'donut', label: 'Split' },
              ...(micros ? [{ value: 'micros' as const, label: 'Micros' }] : []),
            ]}
            selected={chosen}
            onChange={(next) => {
              if (next !== undefined) void services.preferences.saveMacroPicture(next);
            }}
          />
        </div>
      ) : null}
      {chosen === 'micros' ? (
        <MicrosPanel entries={entries} setup={setup} today={today} goals={goals} />
      ) : chosen === 'donut' ? (
        <div className="food-hero-split">
          <MacroSplitChart intake={intake} compact />
        </div>
      ) : (
        <div className="food-hero-macros">
          {shown.map((macro) => (
            <MacroBar
              key={macro}
              macro={macro}
              grams={grams[macro]}
              target={target[macro]}
              minimum={macro === 'protein' ? t?.proteinMinimumG : undefined}
              emphasized={macro === 'protein'}
            />
          ))}
        </div>
      )}
      {status === undefined ? null : (
        <div className="food-hero-status">
          <MmListRow
            title={status}
            subtitle={confidence === undefined ? undefined : `Coach confidence: ${confidence}`}
            leadingIcon="info"
            dense
            flush
            opens
            onPress={onStatusPress ?? (() => undefined)}
          />
        </div>
      )}
    </MmHeroSurface>
  );
}
