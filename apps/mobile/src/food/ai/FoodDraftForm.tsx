import { useState } from 'react';
import type { FoodDraft } from '../../domain/food/custom/FoodDraft';
import { foodDraftProblems } from '../../domain/food/custom/foodDraftProblems';
import type { FoodIngredient } from '../../domain/food/custom/FoodIngredient';
import { FoodGroup } from '../../domain/food/FoodGroup';
import { Micronutrient } from '../../domain/food/micros/Micronutrient';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import { foodGroupLabel } from '../../format/foodGroupLabel';
import { parseNumber } from '../../format/parseNumber';
import { MmButton } from '../../ui/MmButton';
import { MmDropdown } from '../../ui/MmDropdown';
import { MmIconButton } from '../../ui/MmIconButton';
import { MmTextField } from '../../ui/MmTextField';
import { editableNumber } from '../editableNumber';
import '../food.css';

interface FoodDraftFormProps {
  food: FoodDraft;
  onSave: (food: FoodDraft) => void;
  onCancel: () => void;
}

type Field = 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugarAlcohols' | 'alcohol' | Micronutrient;

/** Vitamin A and folate name their basis, as a label states them. */
const basis: Partial<Record<Field, string>> = { vitaminA: ' RAE', folate: ' DFE' };

const labels: Readonly<Record<Exclude<Field, Micronutrient>, string>> = {
  kcal: 'Calories',
  protein: 'Protein g',
  carbs: 'Carbs g',
  fat: 'Fat g',
  fiber: 'Fiber g',
  sugarAlcohols: 'Sugar alcohols g',
  alcohol: 'Alcohol g',
};
const labelOf = (field: Field): string =>
  field in labels ? labels[field as keyof typeof labels] : `${Micronutrient.label(field as Micronutrient)} ${Micronutrient.unit(field as Micronutrient)}${basis[field] ?? ''}`;

/** A field's number in `food`, per 100 g. */
function valueOf(food: FoodDraft, field: Field): number | undefined {
  switch (field) {
    case 'kcal':
      return food.kcal;
    case 'protein':
      return food.proteinG;
    case 'carbs':
      return food.carbsG;
    case 'fat':
      return food.fatG;
    case 'fiber':
      return food.fiberG;
    case 'sugarAlcohols':
      return food.sugarAlcoholsG;
    case 'alcohol':
      return food.alcoholG;
    default:
      return food.micros.of(field);
  }
}

const text = (value: number | undefined) => (value === undefined ? '' : editableNumber(Math.round(value * 100) / 100));

/**
 * Changes one food of an assistant's answer (MM-708), under its row as a
 * meal's food is changed (MM-586): its name, brand and group, what one
 * serving is and weighs, every number per 100 g, and for a homemade food
 * the lines of what went into it, each removable and one addable. A number
 * typed makes the food's numbers the person's own.
 */
export function FoodDraftForm({ food, onSave, onCancel }: FoodDraftFormProps) {
  const [name, setName] = useState(food.name);
  const [brand, setBrand] = useState(food.brand ?? '');
  const [group, setGroup] = useState<FoodGroup | undefined>(FoodGroup.fromName(food.group));
  const [serving, setServing] = useState(food.servingDescription ?? '');
  const [grams, setGrams] = useState(text(food.servingGrams));
  const [typed, setTyped] = useState<Partial<Record<Field, string>>>({});
  const [lines, setLines] = useState<readonly { name: string; grams: string }[]>(food.ingredients.map((line) => ({ name: line.name, grams: text(line.grams) })));
  const [refused, setRefused] = useState<readonly string[]>([]);

  const textOf = (field: Field) => typed[field] ?? text(valueOf(food, field));
  const numberOf = (field: Field): number | undefined => (typed[field] === undefined ? valueOf(food, field) : parseNumber(typed[field] as string));
  const field = (which: Field) => (
    <MmTextField
      key={which}
      label={labelOf(which)}
      kind="number"
      dense
      value={textOf(which)}
      onChange={(value) => setTyped((current) => ({ ...current, [which]: value }))}
    />
  );
  const changeLine = (at: number, change: Partial<{ name: string; grams: string }>) =>
    setLines(lines.map((line, i) => (i === at ? { ...line, ...change } : line)));

  const save = () => {
    const ownNumbers = Object.keys(typed).length > 0;
    const micros = new Micronutrients(Object.fromEntries(Micronutrient.values.map((n) => [n, numberOf(n)])));
    const ingredients: FoodIngredient[] = lines
      .filter((line) => line.name.trim() !== '')
      .map((line) => ({ name: line.name.trim(), grams: parseNumber(line.grams) }));
    const changed: FoodDraft = {
      ...food,
      name: name.trim(),
      brand: brand.trim() === '' ? undefined : brand.trim(),
      group,
      servingDescription: serving.trim() === '' ? undefined : serving.trim(),
      servingGrams: parseNumber(grams),
      kcal: numberOf('kcal'),
      proteinG: numberOf('protein'),
      carbsG: numberOf('carbs'),
      fatG: numberOf('fat'),
      fiberG: numberOf('fiber'),
      sugarAlcoholsG: numberOf('sugarAlcohols'),
      alcoholG: numberOf('alcohol'),
      micros,
      ingredients,
      evidence: ownNumbers ? { kind: 'yours' } : food.evidence,
    };
    const problems = foodDraftProblems(changed);
    setRefused(problems);
    if (problems.length === 0) onSave(changed);
  };

  return (
    <div className="food-line-weight">
      <MmTextField label="Food" value={name} onChange={setName} />
      <MmTextField label="Brand or restaurant" hint="Optional; Homemade" value={brand} onChange={setBrand} />
      <MmDropdown<FoodGroup | undefined>
        label="Food group"
        value={group}
        placeholder="Choose one"
        items={FoodGroup.values.map((value) => ({ value, label: foodGroupLabel(value) }))}
        onChange={setGroup}
      />
      <div className="food-fields">
        <div className="food-field-wide">
          <MmTextField label="One serving is" hint="1 biscuit" dense value={serving} onChange={setServing} />
        </div>
        <MmTextField label="Weighs g" kind="number" dense value={grams} onChange={setGrams} />
      </div>
      <p className="food-label food-label-spaced">Numbers per 100 g</p>
      <div className="food-fields">
        {field('kcal')}
        {field('protein')}
        {field('carbs')}
        {field('fat')}
      </div>
      <div className="food-extra-fields">
        {field('fiber')}
        {field('sugarAlcohols')}
        {field('alcohol')}
        {Micronutrient.values.map((n) => field(n))}
      </div>
      <p className="food-label food-label-spaced">What went into it</p>
      {lines.map((line, at) => (
        <div key={at} className="food-fields">
          <div className="food-field-wide">
            <MmTextField label={`Ingredient ${at + 1}`} dense value={line.name} onChange={(value) => changeLine(at, { name: value })} />
          </div>
          <MmTextField label={`Ingredient ${at + 1} grams`} kind="number" dense value={line.grams} onChange={(value) => changeLine(at, { grams: value })} />
          <MmIconButton icon="close" label={`Remove ingredient ${at + 1}`} onPress={() => setLines(lines.filter((_, i) => i !== at))} />
        </div>
      ))}
      <MmButton label="Add an ingredient" kind="text" icon="plus" onPress={() => setLines([...lines, { name: '', grams: '' }])} />
      {refused.length === 0 ? null : (
        <p className="app-caption food-item-problem" role="alert">
          {refused.join(' ')}
        </p>
      )}
      <MmButton label="Save changes" kind="secondary" expand onPress={save} />
      <MmButton label="Cancel" kind="text" onPress={onCancel} />
    </div>
  );
}
