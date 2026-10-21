import type { ReactNode } from 'react';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import type { FoodEntry } from '../domain/FoodEntry';
import type { IntakeDay } from '../domain/IntakeDay';
import { NutritionGoals } from '../domain/NutritionGoals';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { MacroPicture } from '../domain/MacroPicture';
import { CalorieBand } from '../engine/CalorieBand';
import type { DailyTargets } from '../engine/DailyTargets';
import { intakeStandingOf } from '../engine/intakeStandingOf';
import { calorieAimText } from '../format/calorieAimText';
import { displayTargets } from '../format/displayTargets';
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
import { useNetCarbs } from './useNetCarbs';
import './food.css';

interface CalorieHeroProps {
  /** The day's other lines (fiber, alcohol), inside the hero under its picture, never bare on the canvas (MM-336). */
  lines?: ReactNode;
  intake: IntakeDay;
  /** The day's foods, for the Micros picture (MM-310). */
  entries: readonly FoodEntry[];
  /**
   * Whether Micros is a choice here: on Food only, its one home (owner,
   * 2026-10-14; the panel's PD-1). Elsewhere a remembered Micros shows Grams.
   */
  microsOffered?: boolean;
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
 * a third choice on Food, the day's micronutrients (MM-310).
 *
 * Targets are shown rounded, to the nearest 25 kcal and 5 g, unless the
 * person asked for exact ones; and "on target" is a band, the larger of 5%
 * and 100 kcal either side, drawn on the arc and said in the caption
 * (MM-123). A day below the calorie floor is never on target.
 *
 * On a weight-loss medication (MM-113, MM-510) protein is the headline, its
 * bar above the arc, and calories are a level to reach: what is logged so
 * far and the aim, until the day is over it, when the usual words return.
 */
export function CalorieHero({
  lines,
  intake,
  entries,
  microsOffered = false,
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
  const exact = useLoaded(state.exactTargets) ?? false;
  const floorKcal = useCell(state.coach)?.calorieFloorKcal;
  const shown = DetailLevel.showsCarbsAndFat(level) ? macros : macros.filter((macro) => macro === 'protein');
  // The figures are the rounded targets; the band is judged on the exact ones.
  const t = targets === undefined ? undefined : displayTargets(targets, { exact });
  const left = t === undefined || paused ? undefined : t.kcal - intake.kcal;
  const over = left !== undefined && left < 0;
  const onMedication = setup?.screening.weightLossMedication ?? false;
  const aim = setup === undefined || t === undefined || paused ? undefined : calorieAimText(setup.screening, intake.kcal, t.kcal);
  const logged = Fmt.whole(intake.kcal);
  const figure = left === undefined || aim !== undefined ? logged : Fmt.whole(Math.abs(left));
  const onTarget =
    targets !== undefined && !paused && intakeStandingOf({ kcal: intake.kcal, targetKcal: targets.kcal, floorKcal }) === 'onTarget';
  const onTargetNote = onTarget ? ' · on target' : '';
  let caption: string;
  if (paused && t !== undefined) caption = `kcal logged · paused, guide ${Fmt.whole(t.kcal)}`;
  else if (left === undefined || t === undefined) caption = 'kcal logged';
  // The aim's words begin with the logged figure, which stands above them as the figure.
  else if (aim !== undefined) caption = `${aim.startsWith(`${logged} `) ? aim.slice(logged.length + 1) : aim}${onTargetNote}`;
  else caption = `${over ? `kcal over ${Fmt.whole(t.kcal)}` : `kcal left of ${Fmt.whole(t.kcal)}`}${onTargetNote}`;
  let progress = 0;
  if (t !== undefined && t.kcal > 0) progress = paused ? clamp(intake.kcal / t.kcal, 0, 1) : intake.kcal / t.kcal;
  // The zone that counts as on target, as shares of the target (MM-123); none during a pause.
  let band: readonly [number, number] | undefined;
  if (targets !== undefined && !paused && targets.kcal > 0) {
    const zone = new CalorieBand(targets.kcal);
    band = [zone.lowKcal / targets.kcal, zone.highKcal / targets.kcal];
  }

  // Carbs net of fiber and sugar alcohols while that is on, against the same target, read as net (MM-396).
  const netCarbs = useNetCarbs();
  const grams: Readonly<Record<MacroKind, number>> = {
    protein: intake.proteinG,
    carbs: netCarbs ? intake.netCarbsG : intake.carbsG,
    fat: intake.fatG,
  };
  const target: Readonly<Record<MacroKind, number | undefined>> = { protein: t?.proteinG, carbs: t?.carbsG, fat: t?.fatG };
  // The split of calories needs all three macros; at Simple detail only the bars are offered.
  const switchable = DetailLevel.showsCarbsAndFat(level);
  // Micros is a choice at Full detail only; remembered below it, the bars are shown.
  const micros = microsOffered && DetailLevel.showsExtras(level);
  const chosen: MacroPicture = !switchable || (picture === 'micros' && !micros) ? 'bars' : picture;
  const bar = (macro: MacroKind) => (
    <MacroBar
      key={macro}
      macro={macro}
      grams={grams[macro]}
      target={target[macro]}
      minimum={macro === 'protein' ? t?.proteinMinimumG : undefined}
      emphasized={macro === 'protein'}
      netCarbs={netCarbs}
    />
  );
  // Protein leads on a weight-loss medication, above the calories (MM-113); the bars below hold the rest.
  const below = onMedication ? shown.filter((macro) => macro !== 'protein') : shown;

  return (
    <MmHeroSurface>
      <h2 className="mm-visually-hidden">Calories</h2>
      {onMedication ? <div className="food-hero-headline">{bar('protein')}</div> : null}
      {/* Where the figure is plain text the arc is not spoken too; inside a press it is the spoken figure (MM-389). */}
      <HorizonArc progress={progress} band={band} label={onPress === undefined ? undefined : `${figure} ${caption}`} />
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
            name="What the card shows"
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
          <MacroSplitChart intake={intake} compact netCarbs={netCarbs} />
        </div>
      ) : below.length === 0 ? null : (
        <div className="food-hero-macros">{below.map(bar)}</div>
      )}
      {lines === undefined ? null : <div className="food-hero-lines">{lines}</div>}
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
