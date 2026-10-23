import { mealAnalysisFormatName, mealAnalysisFormatVersion } from '../domain/food/meal/mealAnalysisFormat';
import type { MealDraft } from '../domain/food/meal/MealDraft';
import type { MealItemDraft } from '../domain/food/meal/MealItemDraft';
import { Micronutrient } from '../domain/food/micros/Micronutrient';

/** A minute of the day as the format writes it: "18:30" (MM-594). */
const clock = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

/** At most two decimals, so a scaled number reads as the assistant would write it. */
const rounded = (value: number | undefined) => (value === undefined ? undefined : Math.round(value * 100) / 100);

function itemJson(item: MealItemDraft): Record<string, unknown> {
  const micros = Object.fromEntries(
    Micronutrient.values.flatMap((n) => {
      const amount = rounded(item.micros.of(n));
      return amount === undefined ? [] : [[Micronutrient.column(n), amount]];
    }),
  );
  return {
    name: item.name,
    lookup: item.lookup,
    grams: rounded(item.grams),
    usual_portion: item.usualPortion === undefined ? undefined : { description: item.usualPortion.description, grams: rounded(item.usualPortion.grams) },
    kcal: rounded(item.kcal),
    protein_g: rounded(item.proteinG),
    carbs_g: rounded(item.carbsG),
    fat_g: rounded(item.fatG),
    fiber_g: rounded(item.fiberG),
    ...micros,
    source: { verified: item.evidence.kind === 'cited', citation: item.evidence.citation },
  };
}

/** `draft` in the format the prompt asks for (MM-586), so it can be handed back to the assistant as it stands. */
export function mealDraftJson(draft: MealDraft): string {
  return JSON.stringify(
    {
      format: mealAnalysisFormatName,
      version: mealAnalysisFormatVersion,
      name: draft.name,
      eaten_at:
        draft.eatenAt === undefined ? undefined : `${draft.eatenOn === undefined ? '' : `${draft.eatenOn.toString()}T`}${clock(draft.eatenAt)}`,
      items: draft.items.map(itemJson),
    },
    null,
    2,
  );
}
