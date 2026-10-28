import { useMemo } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useCoachNarration } from '../app/useCoachNarration';
import { useLoaded } from '../app/useLoaded';
import type { CalendarDate } from '../domain/CalendarDate';
import { ItemAnchor } from '../engine/ItemAnchor';
import { Fmt } from '../format/Fmt';
import { inlineLinesNarrationRequest } from '../format/coach/inlineLinesNarrationRequest';
import { inlineLinesOf } from '../format/coach/inlineLinesOf';
import { whyCoachNarrationRejected } from '../format/coach/whyCoachNarrationRejected';
import { mealLabel } from '../format/mealLabel';
import { InlineNarration } from './InlineNarration';
import { inlineInsightContentOf } from './inlineInsightContentOf';

/**
 * The day's inline food lines in the model's words (MM-687): every food
 * insight of `day` goes to the model in one request, numbered, with the
 * day's tools; the answer is read line by line. A line that fails the
 * check on its words, or is missing, leaves that item its built-in words.
 * Waiting while the pass is asked; nothing is asked with no model set up.
 */
export function useInlineNarration(day: CalendarDate): InlineNarration {
  const { state } = useApp();
  const weightDisplay = useCell(state.weightDisplay);
  const insights = useCell(state.itemInsights);
  const units = useLoaded(state.setup)?.unitSystem ?? 'metric';
  const foodInput = useCell(state.coachAnalysis.foodInput);
  const items = useMemo(() => {
    if (foodInput === undefined) return [];
    const fmt = new Fmt(units, { weightDisplay });
    return foodInput.entries
      .filter((e) => e.date.epochDay === day.epochDay)
      .flatMap((entry) => {
        const anchor = { kind: 'foodEntry', id: `${entry.id}` } as const;
        const item = `${entry.name}, ${mealLabel(entry.meal).toLowerCase()}`;
        return (insights.get(ItemAnchor.key(anchor)) ?? []).flatMap((insight) => {
          const content = inlineInsightContentOf(insight, anchor, item, fmt, foodInput);
          return content === undefined ? [] : [{ key: InlineNarration.keyOf(anchor, insight.kind), food: entry.name.trim(), meal: entry.meal, content }];
        });
      });
  }, [foodInput, insights, units, weightDisplay, day.epochDay]);
  const protectedPath = foodInput?.safeguards.eatingDisorderHistory === true;
  const request = useMemo(
    () => (items.length === 0 ? undefined : inlineLinesNarrationRequest(day, items, state.coachToolbox.forDay(day), protectedPath)),
    [items, day, state.coachToolbox, protectedPath],
  );
  const narration = useCoachNarration(request);
  return useMemo(() => {
    if (request === undefined) return { waiting: false, lines: new Map() };
    if (narration.text === undefined) return { waiting: true, lines: new Map() };
    const said = inlineLinesOf(narration.text);
    const lines = new Map<string, string>();
    items.forEach((item, at) => {
      const line = said.get(at + 1);
      if (line === undefined || line === item.content.line) return;
      // Each line on its own words (MM-687); the numbers were checked over the whole answer.
      if (whyCoachNarrationRejected(line, { protectedPath, proteinUnrecoverable: false }) !== undefined) return;
      lines.set(item.key, line);
    });
    return { waiting: false, lines };
  }, [request, narration.text, items, protectedPath]);
}
