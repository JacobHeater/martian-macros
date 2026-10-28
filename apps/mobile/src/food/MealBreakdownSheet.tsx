import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { MealBreakdownAnalysis } from '../engine/analysis/MealBreakdownAnalysis';
import { mealBreakdownAnalysisOf } from '../engine/analysis/mealBreakdownAnalysisOf';
import { mealBreakdownNarrationRequest } from '../format/coach/mealBreakdownNarrationRequest';
import { mealMoveRow } from '../format/coach/mealMoveRow';
import { useCoachNarration } from '../app/useCoachNarration';
import { CoachWritingLine } from '../coach/CoachWritingLine';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import './food.css';

export interface MealBreakdownSheetProps {
  meal: Meal;
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

type BreakdownRow = readonly [title: string, subtitle: string, trailing: string];

function pct(fraction: number): string {
  return `${roundHalfAwayFromZero(fraction * 100) + 0}%`;
}

function buildRows(analysis: MealBreakdownAnalysis): readonly BreakdownRow[] {
  if (analysis.protectedPath) {
    return [
      [
        'Meal protein',
        `${pct(analysis.dailyProteinShare)} of your daily protein target`,
        Fmt.grams(analysis.mealProteinG),
      ],
    ];
  }

  let runwaySubtitle: string;
  let runwayTrailing: string;
  if (analysis.kcalRemaining < 0) {
    runwaySubtitle = 'Past daily calorie target';
    runwayTrailing = `${Fmt.kcal(-analysis.kcalRemaining)} over`;
  } else if (analysis.proteinUnrecoverable) {
    runwaySubtitle = `${Fmt.grams(analysis.proteinRemainingG)} protein left exceeds tonight’s calorie cap`;
    runwayTrailing = `${Fmt.kcal(analysis.kcalRemaining)} left`;
  } else if (analysis.proteinRemainingG <= 0) {
    runwaySubtitle = 'Daily protein floor met';
    runwayTrailing = `${Fmt.kcal(analysis.kcalRemaining)} left`;
  } else {
    runwaySubtitle = `${Fmt.grams(analysis.proteinRemainingG)} protein left · ${pct(analysis.requiredRestOfDayDensity)} P% needed`;
    runwayTrailing = `${Fmt.kcal(analysis.kcalRemaining)} left`;
  }

  const rows: BreakdownRow[] = [
    [
      'Meal impact',
      `${pct(analysis.dailyKcalShare)} of daily calories · ${pct(analysis.dailyProteinShare)} of daily protein`,
      `${Fmt.kcal(analysis.mealKcal)} · ${Fmt.grams(analysis.mealProteinG)} protein`,
    ],
    [
      'Meal protein density (P%)',
      'Share of meal calories from protein',
      pct(analysis.mealProteinDensity),
    ],
    ['Remaining runway', runwaySubtitle, runwayTrailing],
  ];

  if (analysis.outlierItem !== undefined) {
    const item = analysis.outlierItem;
    rows.push([
      'Highest calorie drag',
      `${item.name} · ${pct(item.proteinDensity)} protein density`,
      `${Fmt.kcal(item.kcal)} · ${Fmt.grams(item.proteinG)} protein`,
    ]);
  }

  // The one move the coach orders (MM-684), in a few words with its figures.
  if (analysis.moves.best !== undefined) {
    const row = mealMoveRow(analysis.moves.best);
    rows.push(['Your move', row.subtitle, row.trailing]);
  }

  return rows;
}

/**
 * On-demand coaching breakdown for a meal slot (MM-666): tactical runway
 * impact, protein density ($P\%$), the highest-calorie low-protein outlier item,
 * the one move the coach orders (MM-684), and the coaching narration
 * (offline archetype or BYOK model).
 */
export function MealBreakdownSheet({ meal, day, entries }: MealBreakdownSheetProps) {
  const { state } = useApp();
  const dayEntries = useLoaded(state.foodForDay(day)) ?? entries;
  const targets = useCell(state.currentTargets)?.targets;
  const foodInput = useCell(state.coachAnalysis.foodInput);
  const safeguards = useCell(state.insightSafeguards);

  const kcalTarget = targets?.kcal ?? 2000;
  const proteinTargetG = targets?.proteinG ?? 140;
  const protectedPath = safeguards?.eatingDisorderHistory === true;

  const analysis = mealBreakdownAnalysisOf({
    meal,
    day,
    mealEntries: entries,
    dayEntries,
    candidates: foodInput?.entries ?? dayEntries,
    catalog: foodInput?.catalog,
    kcalTarget,
    proteinTargetG,
    protectedPath,
    snoozed: foodInput?.snoozed,
  });

  // The wait is shown while the person's own model writes; the archetype only once it failed (MM-673). The model is
  // asked with the meal's tools (MM-685), and the wait can be cut short with "Answer now" (MM-686).
  const narration = useCoachNarration(mealBreakdownNarrationRequest(analysis, state.coachToolbox.forMeal(day, meal)));

  const rows = buildRows(analysis);

  return (
    <div className="food-sheet">
      <h2 className="app-headline">{mealLabel(meal)}</h2>
      <p className="food-label">Coach breakdown</p>
      {narration.text === undefined ? <CoachWritingLine onAnswerNow={narration.answerNow} /> : <p className="app-body">{narration.text}</p>}
      <MmListGroup>
        {rows.map(([title, subtitle, trailing]) => (
          <MmListRow key={title} title={title} subtitle={subtitle} trailing={trailing} />
        ))}
      </MmListGroup>
    </div>
  );
}
