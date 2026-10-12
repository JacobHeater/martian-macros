import type { IntakeDay } from '../domain/IntakeDay';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { DailyTargets } from '../engine/DailyTargets';
import { Fmt } from '../format/Fmt';
import { clamp } from '../lang/clamp';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { HorizonArc } from '../ui/HorizonArc';
import { MacroBar } from '../ui/MacroBar';
import { MacroKind } from '../ui/MacroKind';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmStatusChip } from '../ui/MmStatusChip';
import { StatusRow } from '../ui/StatusRow';
import './food.css';

interface CalorieHeroProps {
  intake: IntakeDay;
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
  confidence?: string | undefined;
  onStatusPress?: (() => void) | undefined;
  /** Opens the day's detail. */
  onPress?: (() => void) | undefined;
  /** What the way into the detail is called. */
  pressLabel?: string | undefined;
}

/**
 * The hero of a day: calories as a horizon arc, what is left, the macros,
 * and optionally one status line. The one calorie visual in the app
 * (MM-187): the Dashboard, the Food screen and the Coach screen all use it,
 * and the arc is always drawn.
 */
export function CalorieHero({
  intake,
  targets,
  paused = false,
  macros = MacroKind.values,
  status,
  confidence,
  onStatusPress,
  onPress,
  pressLabel,
}: CalorieHeroProps) {
  const { state } = useApp();
  // Simple detail shows calories and protein only (MM-49).
  const level = useLoaded(state.detailLevel) ?? 'standard';
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

  return (
    <MmHeroSurface>
      <HorizonArc progress={progress} label={`${figure} ${caption}`} />
      {onPress === undefined ? (
        <>
          <p className="food-hero-figure">{figure}</p>
          <p className="food-hero-caption">{caption}</p>
        </>
      ) : (
        <button type="button" className="food-hero-open" aria-label={pressLabel} onClick={onPress}>
          <span className="food-hero-figure">{figure}</span>
          <span className="food-hero-caption">{caption}</span>
        </button>
      )}
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
      {status === undefined ? null : (
        <div className="food-hero-status">
          <StatusRow text={status} onPress={onStatusPress ?? (() => undefined)} />
        </div>
      )}
      {confidence === undefined ? null : (
        <div className="food-hero-confidence">
          <MmStatusChip label={confidence} />
        </div>
      )}
    </MmHeroSurface>
  );
}
