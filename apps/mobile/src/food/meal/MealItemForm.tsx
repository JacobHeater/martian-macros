import { useState } from 'react';
import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import { mealItemProblems } from '../../domain/food/meal/mealItemProblems';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import { QuantitySource } from '../../domain/QuantitySource';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import { Fmt } from '../../format/Fmt';
import { foodSourceLabel } from '../../format/foodSourceLabel';
import { parseNumber } from '../../format/parseNumber';
import { quantitySourceLabel } from '../../format/quantitySourceLabel';
import { useApp } from '../../app/useApp';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmChoiceChip } from '../../ui/MmChoiceChip';
import { MmListRow } from '../../ui/MmListRow';
import { MmTextField } from '../../ui/MmTextField';
import { editableNumber } from '../editableNumber';
import { matchedMealItem } from './matchedMealItem';
import { per100Label } from '../../format/per100Label';
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

/** How many of the app's foods "Look up" offers to choose from (MM-647). */
const matchesOffered = 5;

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
 * as a recipe line's weight is changed (MM-456), with its usual portion
 * (MM-595), the amount eaten when none is given. Changing the grams scales
 * every number the person has not typed, so the food stays the same and
 * only the amount changes. A number typed makes the food the person's own.
 * How the grams were measured is asked as the typed form asks it (MM-646):
 * the assistant's own item keeps its photo estimate unless the person says
 * otherwise, and a food added by hand must say. "Look up" offers the foods
 * in the app's packs that the name finds, and the one chosen gives its
 * numbers at these grams (MM-647).
 */
export function MealItemForm({ item, onSave, onCancel, requireComplete = false }: MealItemFormProps) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const [base, setBase] = useState<MealItemDraft>(item ?? blank);
  const [name, setName] = useState(base.name);
  const [grams, setGrams] = useState(base.grams === undefined ? '' : editableNumber(base.grams));
  // The assistant's own item is a photo estimate until the person says otherwise; a food typed by hand has no method yet.
  const [method, setMethod] = useState<QuantitySource | undefined>(item === undefined ? undefined : (item.method ?? 'photoEstimate'));
  // A reasonable serving of it on its own (MM-595): kept with the food, to log it again.
  const [usual, setUsual] = useState(base.usualPortion?.description ?? '');
  const [usualGrams, setUsualGrams] = useState(base.usualPortion === undefined ? '' : editableNumber(base.usualPortion.grams));
  const [typed, setTyped] = useState<Partial<Record<Field, string>>>({});
  const [lookupNote, setLookupNote] = useState<string>();
  /** The foods the name found, offered to choose from (MM-647); none until Look up, or once one is chosen. */
  const [matches, setMatches] = useState<readonly CatalogFood[]>([]);
  const [refused, setRefused] = useState<readonly string[]>([]);

  // Only a photo estimate can stay one: typing never makes one (MM-586).
  const methods = QuantitySource.values.filter((source) => source !== 'photoEstimate' || (item !== undefined && (item.method ?? 'photoEstimate') === 'photoEstimate'));

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
    const hits = await catalog.search(query, { limit: matchesOffered });
    if (hits.length === 0) {
      setMatches([]);
      setLookupNote(`Nothing in the app’s foods matched “${query}”.`);
      return;
    }
    setMatches(hits.map((hit) => hit.food));
    setLookupNote(hits.length === 1 ? 'One food matched. Press it to use its numbers.' : `${hits.length} foods matched. Press the one it is.`);
  };
  /** Takes the food chosen among the matches: its numbers at these grams, and the line under the food names it. */
  const use = (food: CatalogFood) => {
    const query = name.trim();
    setBase(matchedMealItem({ ...base, name: query, grams: gramsNow ?? base.grams }, food));
    setTyped({});
    setMatches([]);
    setLookupNote(`Using ${food.name}.`);
  };

  const save = () => {
    // A number typed makes the numbers the person's own; a food matched keeps the match it was given.
    const ownNumbers = Object.keys(typed).length > 0;
    const usualNow = parseNumber(usualGrams);
    const changed: MealItemDraft = {
      ...base,
      name: name.trim(),
      grams: gramsNow,
      method,
      // Left empty, the usual portion is what was eaten.
      usualPortion:
        usual.trim() !== '' && usualNow !== undefined
          ? { description: usual.trim(), grams: usualNow }
          : gramsNow === undefined
            ? undefined
            : { description: `${editableNumber(gramsNow)} g`, grams: gramsNow },
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
    const problems = [
      // A food typed by hand says how its grams were measured, as the typed form asks (MM-646).
      ...(method === undefined ? ['Say how it was measured.'] : []),
      ...(requireComplete ? mealItemProblems(changed) : []),
    ];
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
      <p className="food-label food-label-spaced">How was it measured?</p>
      <div className="app-row" role="group" aria-label="How was it measured?">
        {methods.map((source) => (
          <MmChoiceChip key={source} label={quantitySourceLabel(source)} selected={method === source} onSelect={() => setMethod(source)} />
        ))}
      </div>
      <div className="food-fields">
        <MmTextField label="Usual portion" hint="1 cup" dense value={usual} onChange={setUsual} />
        <MmTextField label="Its grams" kind="number" dense value={usualGrams} onChange={setUsualGrams} />
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
      {/* The foods the name found, to choose the one it is (MM-647): never the first taken unasked. */}
      {matches.map((food) => (
        <MmListRow
          key={`${food.packId}:${food.id}`}
          dense
          title={food.name}
          subtitle={`${food.brand === undefined ? '' : `${food.brand} · `}${Fmt.kcal(food.kcal)} ${per100Label(food.basis)} · ${foodSourceLabel(food)}`}
          onPress={() => use(food)}
        />
      ))}
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
