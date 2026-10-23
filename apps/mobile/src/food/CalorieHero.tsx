import { type ReactNode, useId, useState } from 'react';
import { IntakeTimeline } from '../charts/IntakeTimeline';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import type { FoodEntry } from '../domain/FoodEntry';
import type { IntakeDay } from '../domain/IntakeDay';
import { NutritionGoals } from '../domain/NutritionGoals';
import { intakeStepsOf } from '../domain/food/timeline/intakeStepsOf';
import { usualDayOf } from '../domain/food/timeline/usualDayOf';
import { usualKcalAt } from '../domain/food/timeline/usualKcalAt';
import { rankedSources } from '../domain/food/rankedSources';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { MacroPicture } from '../domain/MacroPicture';
import { CalorieBand } from '../engine/CalorieBand';
import type { DailyTargets } from '../engine/DailyTargets';
import { intakeStandingOf } from '../engine/intakeStandingOf';
import { calorieAimText } from '../format/calorieAimText';
import { displayTargets } from '../format/displayTargets';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { minuteOfDayText } from '../format/minuteOfDayText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MacroBar } from '../ui/MacroBar';
import { MacroKind } from '../ui/MacroKind';
import type { MmAnchor } from '../ui/MmAnchor';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmListRow } from '../ui/MmListRow';
import { MmPressable } from '../ui/MmPressable';
import { MmSegmented } from '../ui/MmSegmented';
import { useOverlays } from '../ui/useOverlays';
import { MicrosPanel } from './MicrosPanel';
import { minuteOfDayNow } from '../state/minuteOfDayNow';
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
 * a third choice on Food, the day's micronutrients (MM-310). Pressing a
 * macro, as a bar or in the split, opens its top five foods with each one's
 * meal (MM-562).
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
  const overlays = useOverlays();
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
  // The figure is what was eaten; what is left or over stands beside it (MM-571).
  const figure = logged;
  const onTarget =
    targets !== undefined && !paused && intakeStandingOf({ kcal: intake.kcal, targetKcal: targets.kcal, floorKcal }) === 'onTarget';
  const onTargetNote = onTarget ? ' · on target' : '';
  let caption: string;
  // What is left or over, beside the figure, when there is a target to read it against.
  let delta: { figure: string; caption: string } | undefined;
  if (paused && t !== undefined) caption = `kcal logged · paused, guide ${Fmt.whole(t.kcal)}`;
  else if (left === undefined || t === undefined) caption = 'kcal logged';
  // The aim's words begin with the logged figure, which stands above them as the figure.
  else if (aim !== undefined) caption = `${aim.startsWith(`${logged} `) ? aim.slice(logged.length + 1) : aim}${onTargetNote}`;
  else {
    caption = 'kcal eaten';
    delta = over
      ? { figure: `+${Fmt.whole(-left)}`, caption: `over ${Fmt.whole(t.kcal)}${onTargetNote}` }
      : { figure: Fmt.whole(left), caption: `left of ${Fmt.whole(t.kcal)}${onTargetNote}` };
  }
  // The zone that counts as on target (MM-123), in kcal; none during a pause.
  let band: readonly [number, number] | undefined;
  if (targets !== undefined && !paused && targets.kcal > 0) {
    const zone = new CalorieBand(targets.kcal);
    band = [zone.lowKcal, zone.highKcal];
  }

  // The day's running total over the clock, and the person's usual day under it (MM-571, MM-572).
  const steps = intakeStepsOf(entries);
  const isToday = intake.date.epochDay === today.epochDay;
  const nowMinute = isToday ? minuteOfDayNow(services.clock) : undefined;
  const before = useLoaded(state.foodBefore(intake.date));
  const usual =
    before === undefined
      ? undefined
      : usualDayOf(
          Array.from({ length: 28 }, (_, i) => intake.date.addDays(i - 28)).map((date) =>
            before.filter((entry) => entry.date.epochDay === date.epochDay),
          ),
        );
  const crossed = t === undefined || paused ? undefined : steps.find((step) => step.total > t.kcal);
  const story: string[] = [];
  if (crossed !== undefined) {
    const when = crossed.approximate ? '' : `, ${minuteOfDayText(crossed.minute)}`;
    story.push(`You passed your target at ${mealLabel(crossed.meal).toLowerCase()}${when}.`);
  }
  const usualNow = usual === undefined || nowMinute === undefined || steps.length === 0 ? undefined : usualKcalAt(usual, nowMinute);
  if (usualNow !== undefined) {
    const difference = intake.kcal - usualNow;
    if (Math.abs(difference) <= Math.max(100, usualNow * 0.1)) story.push('Close to your usual day so far.');
    else story.push(`${Fmt.whole(Math.abs(difference))} kcal ${difference > 0 ? 'ahead of' : 'behind'} your usual day so far.`);
  }

  // Carbs net of fiber and sugar alcohols while that is on, against the same target, read as net (MM-396).
  const netCarbs = useNetCarbs();
  const grams: Readonly<Record<MacroKind, number>> = {
    protein: intake.proteinG,
    carbs: netCarbs ? intake.netCarbsG : intake.carbsG,
    fat: intake.fatG,
  };
  const target: Readonly<Record<MacroKind, number | undefined>> = { protein: t?.proteinG, carbs: t?.carbsG, fat: t?.fatG };
  // The macro whose top foods are open (MM-562).
  const [picked, setPicked] = useState<MacroKind | undefined>(undefined);
  const gramsOf = (macro: MacroKind) => (entry: FoodEntry) =>
    macro === 'protein' ? entry.proteinG : macro === 'fat' ? entry.fatG : netCarbs ? entry.netCarbsG : entry.carbsG;
  const pick = (macro: MacroKind, anchor: MmAnchor) => {
    // A second press closes it (MM-565).
    if (picked !== undefined) {
      overlays.closeTop();
      return;
    }
    const name = MacroKind.label(macro, { netCarbs });
    const sources = rankedSources(entries, gramsOf(macro), (entry) => `${entry.meal}|${entry.name}`);
    setPicked(macro);
    void overlays
      .popover({
        title: name,
        label: `Top foods for ${name.toLowerCase()}`,
        message: sources.length === 0 ? `No food logged has ${name.toLowerCase()}.` : undefined,
        rows: sources.map(({ entry, amount }) => ({ label: entry.name, figures: Fmt.grams(amount), tag: mealLabel(entry.meal) })),
        anchor,
      })
      .then(() => setPicked(undefined));
  };
  // The split of calories needs all three macros; at Simple detail only the bars are offered.
  const switchable = DetailLevel.showsCarbsAndFat(level);
  // Micros is a choice at Full detail only; remembered below it, the bars are shown.
  const micros = microsOffered && DetailLevel.showsExtras(level);
  const chosen: MacroPicture = !switchable || (picture === 'micros' && !micros) ? 'bars' : picture;
  const bar = (macro: MacroKind) => (
    <MmPressable key={macro} expanded={picked === macro} onPress={(anchor) => pick(macro, anchor)}>
      <MacroBar
        macro={macro}
        grams={grams[macro]}
        target={target[macro]}
        minimum={macro === 'protein' ? t?.proteinMinimumG : undefined}
        emphasized={macro === 'protein'}
        netCarbs={netCarbs}
      />
    </MmPressable>
  );
  // Protein leads on a weight-loss medication, above the calories (MM-113); the bars below hold the rest.
  const below = onMedication ? shown.filter((macro) => macro !== 'protein') : shown;

  const headId = `${useId()}-head`;
  const head = (
    <span className="food-hero-head" id={headId}>
      <span className="food-hero-eaten">
        <span className="food-hero-figure">{figure}</span>
        <span className="food-hero-caption">{caption}</span>
      </span>
      {delta === undefined ? null : (
        <span className="food-hero-delta">
          <span className="food-hero-delta-figure">{delta.figure}</span>
          <span className="food-hero-caption">{delta.caption}</span>
        </span>
      )}
    </span>
  );

  return (
    <MmHeroSurface>
      <h2 className="mm-visually-hidden">Calories</h2>
      {onMedication ? <div className="food-hero-headline">{bar('protein')}</div> : null}
      {onPress === undefined ? (
        head
      ) : (
        <MmPressable label={pressLabel} describedBy={headId} onPress={onPress}>
          {head}
        </MmPressable>
      )}
      <IntakeTimeline
        steps={steps}
        targetKcal={t?.kcal}
        targetWord={paused ? 'guide' : 'target'}
        band={band}
        nowMinute={nowMinute}
        usual={usual}
      />
      {story.length === 0 ? null : <p className="food-hero-story">{story.join(' ')}</p>}
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
              if (next === undefined) return;
              // A choice that could not be kept is said, as Settings says one (MM-179, MM-347).
              void services.preferences.saveMacroPicture(next).catch(() => {
                overlays.snack('Could not keep that choice.');
              });
            }}
          />
        </div>
      ) : null}
      {chosen === 'micros' ? (
        <MicrosPanel entries={entries} setup={setup} today={today} goals={goals} />
      ) : chosen === 'donut' ? (
        <div className="food-hero-split">
          <MacroSplitChart intake={intake} compact netCarbs={netCarbs} onPick={pick} picked={picked} />
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
