import type { FoodAnalysisInput } from '../engine/analysis/food/FoodAnalysisInput';
import { recordOnOf } from '../engine/analysis/food/recordOnOf';
import { foodMovesOf } from '../engine/analysis/moves/foodMovesOf';
import type { ItemAnchor } from '../engine/ItemAnchor';
import type { ItemInsight } from '../engine/ItemInsight';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { mealMoveOrder } from '../format/coach/mealMoveOrder';
import { mealMoveRow } from '../format/coach/mealMoveRow';
import type { Fmt } from '../format/Fmt';
import { itemInsightText } from '../format/itemInsightText';
import type { InlineInsightContent } from './InlineInsightContent';

/**
 * What the coach says under one item for one insight (MM-362), ready to
 * draw, to log once shown (MM-363) and to snooze (MM-378). A food entry's
 * `mostlyFat` or `lightOnProtein` line ends in the food's own move
 * (MM-684): a same-group swap, a protein food added or a cut, in the
 * approved words, with the move among the evidence rows. Undefined for a
 * kind with no words.
 */
export function inlineInsightContentOf(
  insight: ItemInsight,
  anchor: ItemAnchor,
  item: string,
  fmt: Fmt,
  foodInput: FoodAnalysisInput | undefined,
): InlineInsightContent | undefined {
  const kind = itemInsightKinds.find((k) => k.id === insight.kind);
  const text = itemInsightText(insight, fmt);
  if (kind === undefined || text === undefined) return undefined;

  let line = text.line;
  let evidence = text.evidence;

  if (anchor.kind === 'foodEntry' && (insight.kind === 'mostlyFat' || insight.kind === 'lightOnProtein') && foodInput !== undefined) {
    const entry = foodInput.entries.find((e) => `${e.id}` === anchor.id);
    if (entry !== undefined) {
      const record = recordOnOf(foodInput.history)(entry.date);
      const [move] = foodMovesOf(
        {
          meal: entry.meal,
          mealEntries: foodInput.entries.filter((e) => e.date.epochDay === entry.date.epochDay && e.meal === entry.meal),
          dayEntries: foodInput.entries.filter((e) => e.date.epochDay === entry.date.epochDay),
          dailyKcalTarget: record?.targets.kcal ?? 0,
          dailyProteinTargetG: record?.targets.proteinG ?? 0,
          goal: record?.mode ?? 'fatLoss',
          history: foodInput.entries,
          catalog: foodInput.catalog,
          safeguards: foodInput.safeguards,
          cautions: foodInput.safeguards.cautions,
          snoozed: foodInput.snoozed,
        },
        entry,
      );
      if (move !== undefined) {
        const fact = line.split('. ')[0] ?? line;
        line = `${fact}. ${mealMoveOrder(move, entry.meal, 'inline')}`;
        const row = mealMoveRow(move);
        evidence = [...evidence, ['Your move', `${row.subtitle} (${row.trailing})`]];
      }
    }
  }

  return {
    line,
    evidence,
    area: kind.area,
    rule: kind.title,
    logged: { kind: kind.id, area: kind.area, anchor, item, line },
    snooze: { kind: kind.id, subject: insight.subject, item },
  };
}
