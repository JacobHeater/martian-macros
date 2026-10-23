import { useState } from 'react';
import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import { mealItemProblems } from '../../domain/food/meal/mealItemProblems';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import { parseNumber } from '../../format/parseNumber';
import { useApp } from '../../app/useApp';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmTextField } from '../../ui/MmTextField';
import { editableNumber } from '../editableNumber';
import { matchedMealItem } from './matchedMealItem';
import '../food.css';

interface MealItemFormProps {
  /** The food being changed; none for a food being added. */
  item?: MealItemDraft | undefined;
  onSave: (item: MealItemDraft) => void;
  onCancel: () => void;
  /** Saved only once nothing is wrong with it: for a food already logged (MM-587). */
  requireComplete?: boolean;
}

type Field = 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugars' | 'saturatedFat' | 'sodium';

const blank: MealItemDraft = { name: '', micros: Micronutrients.none, evidence: { kind: 'yours' } };

/** A field's number in `item`. */
function valueOf(item: MealItemDraft, field: Field): number | undefined {
  switch (field) {
    case 'kcal':
      return item.kcal;
    case 'protein':
      return item.proteinG;
    case 'carbs':
      return item.carbsG;
    case 'fat':
      return item.fatG;
    case 'fiber':
      return item.fiberG;
    case 'sugars':
      return item.micros.of('sugars');
    case 'saturatedFat':
      return item.micros.of('saturatedFat');
    case 'sodium':
      return item.micros.of('sodium');
  }
}

/**
 * Changes one food of a meal, or adds one (MM-586, MM-587), under its row
 * as a recipe line's weight is changed (MM-456). Changing the grams scales
 * every number the person has not typed, so the food stays the same and
 * only the amount changes. A number typed makes the food the person's own.
 * "Look up" takes the numbers of the food in the app's packs that the name
 * finds, at these grams.
 */
export function MealItemForm({ item, onSave, onCancel, requireComplete = false }: MealItemFormProps) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const [base, setBase] = useState<MealItemDraft>(item ?? blank);
  const [name, setName] = useState(base.name);
  const [grams, setGrams] = useState(base.grams === undefined ? '' : editableNumber(base.grams));
  const [typed, setTyped] = useState<Partial<Record<Field, string>>>({});
  const [lookupNote, setLookupNote] = useState<string>();
  const [refused, setRefused] = useState<readonly string[]>([]);

  const gramsNow = parseNumber(grams);
  const factor = base.grams !== undefined && base.grams > 0 && gramsNow !== undefined && gramsNow > 0 ? gramsNow / base.grams : 1;
  const numberOf = (field: Field): number | undefined => {
    const text = typed[field];
    if (text !== undefined) return parseNumber(text);
    const value = valueOf(base, field);
    return value === undefined ? undefined : value * factor;
  };
  const textOf = (field: Field): string => {
    const text = typed[field];
    if (text !== undefined) return text;
    const value = numberOf(field);
    return value === undefined ? '' : editableNumber(Math.round(value * 10) / 10);
  };
  const field = (which: Field, label: string) => (
    <MmTextField
      label={label}
      kind="number"
      dense
      value={textOf(which)}
      onChange={(text) => setTyped((current) => ({ ...current, [which]: text }))}
    />
  );

  const lookUp = async () => {
    const query = name.trim();
    if (catalog === undefined || query === '' || gramsNow === undefined || !(gramsNow > 0)) {
      setLookupNote('Give the food a name and its grams to look it up.');
      return;
    }
    const [hit] = await catalog.search(query, { limit: 1 });
    if (hit === undefined) {
      setLookupNote(`Nothing in the app’s foods matched “${query}”.`);
      return;
    }
    setBase(matchedMealItem({ ...base, name: query, grams: gramsNow }, hit.food));
    setTyped({});
    setLookupNote(`Using ${hit.food.name}.`);
  };

  const save = () => {
    const ownNumbers = item === undefined || Object.keys(typed).length > 0;
    const changed: MealItemDraft = {
      ...base,
      name: name.trim(),
      grams: gramsNow,
      kcal: numberOf('kcal'),
      proteinG: numberOf('protein'),
      carbsG: numberOf('carbs'),
      fatG: numberOf('fat'),
      fiberG: numberOf('fiber'),
      micros: base.micros
        .times(factor)
        .with('sugars', numberOf('sugars'))
        .with('saturatedFat', numberOf('saturatedFat'))
        .with('sodium', numberOf('sodium')),
      evidence: ownNumbers ? { kind: 'yours' } : base.evidence,
    };
    const problems = requireComplete ? mealItemProblems(changed) : [];
    setRefused(problems);
    if (problems.length === 0) onSave(changed);
  };

  return (
    <div className="food-line-weight">
      <MmTextField label="Food" value={name} onChange={setName} />
      <div className="food-fields">
        <MmTextField label="Grams eaten" kind="number" dense value={grams} onChange={setGrams} />
        {field('kcal', 'Calories')}
      </div>
      <div className="food-extra-fields">
        {field('protein', 'Protein g')}
        {field('carbs', 'Carbs g')}
        {field('fat', 'Fat g')}
        {field('fiber', 'Fiber g')}
        {field('sugars', 'Sugars g')}
        {field('saturatedFat', 'Sat. fat g')}
        {field('sodium', 'Sodium mg')}
      </div>
      <MmButton label="Look up in the app’s foods" kind="text" icon="search" onPress={() => void lookUp()} />
      {/* What the lookup found, or that it found nothing, is said as it changes. */}
      <p className="app-caption" role="status">
        {lookupNote ?? ''}
      </p>
      {refused.length === 0 ? null : (
        <p className="app-caption food-item-problem" role="alert">
          {refused.join(' ')}
        </p>
      )}
      <MmButton label={item === undefined ? 'Add food' : 'Save food'} kind="secondary" expand onPress={save} />
      <MmButton label="Cancel" kind="text" onPress={onCancel} />
    </div>
  );
}
