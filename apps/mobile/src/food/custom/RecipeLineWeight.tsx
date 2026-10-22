import { useState } from 'react';
import type { RecipeIngredient } from '../../domain/food/custom/RecipeIngredient';
import { reweighedIngredient } from '../../domain/food/custom/reweighedIngredient';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { Fmt } from '../../format/Fmt';
import { parseNumber } from '../../format/parseNumber';
import { quantityText } from '../../format/quantityText';
import { useApp } from '../../app/useApp';
import { useAsync } from '../../app/useAsync';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmTextField } from '../../ui/MmTextField';
import '../food.css';

interface RecipeLineWeightProps {
  /** A line found in a pack (it has a source). */
  line: RecipeIngredient;
  /** Called with the line at its new weight, or with nothing when it is left as it was. */
  onDone: (line?: RecipeIngredient) => void;
}

/**
 * Changes a found line's weight in place (MM-456): its totals are worked out
 * again from its food's numbers per 100 g as the pack has them now. Drawn
 * under its row, indented as the row's own entry slot, with the field taking
 * focus as it opens. Offered only for a line whose food is installed
 * (`RecipeForm`); should the food go while it is open, nothing is drawn.
 */
export function RecipeLineWeight({ line, onDone }: RecipeLineWeightProps) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const [grams, setGrams] = useState(line.grams === undefined ? '' : quantityText(line.grams));
  const source = line.source;
  const looked = useAsync(
    async () => ({
      food: catalog === undefined || source === undefined ? undefined : await catalog.foodById(source.packId, source.foodId),
    }),
    `${catalog?.packs.length ?? -1}:${source?.packId ?? ''}:${source?.foodId ?? ''}`,
  );
  if (catalog === undefined || looked === undefined) return null;
  const food = looked.food;
  if (food === undefined) return null;
  const weight = parseNumber(grams);
  const per100g = new NutritionTotals({ kcal: food.kcal, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG });
  const reweighed = weight === undefined ? undefined : reweighedIngredient(line, per100g, weight);
  return (
    <div className="food-line-weight">
      <MmTextField
        label="Weight g"
        name={`Weight g for ${line.name}`}
        kind="number"
        value={grams}
        onChange={setGrams}
        autoFocus
        onSubmit={reweighed === undefined ? undefined : () => onDone(reweighed)}
      />
      <p className="app-caption">
        {reweighed === undefined
          ? 'Worked out again from the food as it is installed now.'
          : `${quantityText(reweighed.grams ?? 0)} g is about ${Fmt.kcal(reweighed.totals.kcal)}.`}
      </p>
      <div className="app-row">
        <MmButton label="Save weight" kind="secondary" onPress={reweighed === undefined ? undefined : () => onDone(reweighed)} />
        <MmButton label="Cancel" kind="text" onPress={() => onDone()} />
      </div>
    </div>
  );
}
