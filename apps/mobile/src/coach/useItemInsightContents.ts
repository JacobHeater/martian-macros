import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { swapFor } from '../engine/analysis/swap/swapFor';
import type { ItemAnchor } from '../engine/ItemAnchor';
import { ItemAnchor as Anchor } from '../engine/ItemAnchor';
import type { ItemInsight } from '../engine/ItemInsight';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { Fmt } from '../format/Fmt';
import { itemInsightText } from '../format/itemInsightText';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import type { InlineInsightContent } from './InlineInsightContent';

const none: readonly ItemInsight[] = [];
const whole = (n: number) => `${roundHalfAwayFromZero(n) + 0}`;

/**
 * What the coach says under one item (MM-362, MM-666), every line that holds,
 * the higher priority first (MM-393), each ready to draw, to log once shown
 * (MM-363) and to snooze (MM-378). When a food entry triggers `mostlyFat` or
 * `lightOnProtein` and a qualifying higher-protein swap exists (`swapFor`),
 * the line and evidence surface the concrete swap and protein density ($P\%$).
 */
export function useItemInsightContents(anchor: ItemAnchor, item: string): readonly InlineInsightContent[] {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const insights = useCell(state.itemInsights).get(Anchor.key(anchor)) ?? none;
  const units = useLoaded(state.setup)?.unitSystem ?? 'metric';
  const foodInput = useCell(state.coachAnalysis.foodInput);
  return insights.flatMap((insight) => {
    const kind = itemInsightKinds.find((k) => k.id === insight.kind);
    const text = itemInsightText(insight, new Fmt(units, { weightDisplay }));
    if (kind === undefined || text === undefined) return [];

    let line = text.line;
    let evidence = text.evidence;

    if (
      anchor.kind === 'foodEntry' &&
      (insight.kind === 'mostlyFat' || insight.kind === 'lightOnProtein') &&
      foodInput !== undefined
    ) {
      const entry = foodInput.entries.find((e) => `${e.id}` === anchor.id);
      if (entry !== undefined) {
        const swap = swapFor({
          kind: insight.kind === 'mostlyFat' ? 'fat' : 'protein',
          x: entry,
          candidates: foodInput.entries,
          catalog: foodInput.catalog,
          snoozed: foodInput.snoozed,
        });
        if (swap !== undefined) {
          const firstSentence = line.split('. ')[0] ?? line;
          const swapDetail = `${swap.name} (${whole(swap.proteinG)} g protein, ${whole(swap.kcal)} kcal)`;
          line = `${firstSentence}. Swap for ${swapDetail} next time.`;
          evidence = [
            ...evidence,
            ['Suggested swap', swapDetail],
          ];
        }
      }
    }

    return [
      {
        line,
        evidence,
        area: kind.area,
        rule: kind.title,
        logged: { kind: kind.id, area: kind.area, anchor, item, line },
        snooze: { kind: kind.id, subject: insight.subject, item },
      },
    ];
  });
}
