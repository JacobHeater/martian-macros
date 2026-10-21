import { useState } from 'react';
import type { RecipeIngredient } from '../../domain/food/custom/RecipeIngredient';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import { parseNumber } from '../../format/parseNumber';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useAsync } from '../../app/useAsync';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmSegmented } from '../../ui/MmSegmented';
import { MmTextField } from '../../ui/MmTextField';
import { weighedConsequence } from '../weighedConsequence';
import { weighedStateLabel } from '../weighedStateLabel';
import '../food.css';

const per100g = (food: CatalogFood) => `${roundHalfAwayFromZero(food.kcal) + 0} kcal per 100 g`;

/**
 * Adds one line to a recipe (MM-45): a food found by search and a weight,
 * or a name and the totals typed in. Calls `onAdd` with the line and
 * clears. A found food the pack has raw and cooked asks which state was
 * weighed, as the amount step does (MM-151), and the line is of that state.
 */
export function RecipeIngredientAdder({ onAdd }: { onAdd: (line: RecipeIngredient) => void }) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState('');
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [picked, setPicked] = useState<CatalogFood>();
  const [byNumbers, setByNumbers] = useState(false);
  const [useAlternate, setUseAlternate] = useState(false);

  const searching = !byNumbers && picked === undefined && query.trim() !== '';
  const hits =
    useAsync(
      () => (searching && catalog !== undefined ? catalog.search(query.trim(), { limit: 5 }) : Promise.resolve([])),
      `${catalog?.packs.length ?? -1}:${searching ? query.trim() : ''}`,
    ) ?? [];

  const alternate = useAsync(
    () => (picked !== undefined && catalog !== undefined ? catalog.pairOf(picked) : Promise.resolve(undefined)),
    `${catalog?.packs.length ?? -1}:${picked === undefined ? '' : `${picked.packId}:${picked.id}`}`,
  );
  const weighed = useAlternate && alternate !== undefined ? alternate : picked;
  const choose = (food: CatalogFood | undefined) => {
    setPicked(food);
    setUseAlternate(false);
  };

  const weight = parseNumber(grams);
  const line = (): RecipeIngredient | undefined => {
    if (byNumbers) {
      const energy = parseNumber(kcal);
      const typed = name.trim();
      if (typed === '' || energy === undefined || energy < 0) return undefined;
      return {
        name: typed,
        grams: weight !== undefined && weight > 0 ? weight : undefined,
        totals: new NutritionTotals({
          kcal: energy,
          proteinG: parseNumber(protein) ?? 0,
          carbsG: parseNumber(carbs) ?? 0,
          fatG: parseNumber(fat) ?? 0,
        }),
      };
    }
    if (weighed === undefined || weight === undefined || weight <= 0) return undefined;
    return {
      name: weighed.brand === undefined ? weighed.name : `${weighed.name} (${weighed.brand})`,
      grams: weight,
      totals: new NutritionTotals({
        kcal: weighed.kcal,
        proteinG: weighed.proteinG,
        carbsG: weighed.carbsG,
        fatG: weighed.fatG,
      }).times(weight / 100),
      // The pack food it was found as, so its weight can be changed in place later (MM-456).
      source: { packId: weighed.packId, foodId: weighed.id },
    };
  };
  const ready = line();

  const add = () => {
    if (ready === undefined) return;
    onAdd(ready);
    choose(undefined);
    for (const clear of [setQuery, setGrams, setName, setKcal, setProtein, setCarbs, setFat]) clear('');
  };

  return (
    <div className="food-ingredient-adder">
      <p className="food-label">Add an ingredient</p>
      {byNumbers ? (
        <>
          <MmTextField label="Ingredient" value={name} onChange={setName} />
          <div className="app-gap-small" />
          <div className="food-fields">
            <MmTextField label="kcal" kind="number" dense value={kcal} onChange={setKcal} />
            <MmTextField label="Protein g" kind="number" dense value={protein} onChange={setProtein} />
            <MmTextField label="Carbs g" kind="number" dense value={carbs} onChange={setCarbs} />
            <MmTextField label="Fat g" kind="number" dense value={fat} onChange={setFat} />
          </div>
          <p className="app-caption">Totals for the amount you put in the pot.</p>
        </>
      ) : (
        <>
          {picked === undefined ? (
            <MmTextField label="Search ingredients" value={query} onChange={setQuery} />
          ) : (
            <MmListRow
              title={picked.name}
              subtitle={per100g(picked)}
              trailingAction={<MmButton label="Change" kind="text" onPress={() => choose(undefined)} />}
            />
          )}
          {hits.map(({ food }) => (
            <MmListRow
              key={`${food.packId}-${food.id}`}
              title={food.name}
              subtitle={per100g(food)}
              onPress={() => choose(food)}
            />
          ))}
        </>
      )}
      <div className="app-gap-small" />
      <MmTextField
        label={byNumbers ? 'Weight g (optional)' : 'Weight g'}
        kind="number"
        value={grams}
        onChange={setGrams}
      />
      {!byNumbers && picked !== undefined && alternate !== undefined ? (
        <>
          {/* Raw and cooked weigh differently for the same energy (MM-45, MM-151). */}
          <p className="food-label food-label-spaced">Weighed as</p>
          <MmSegmented<boolean>
            name="Weighed as"
            segments={[
              { value: false, label: weighedStateLabel(picked) },
              { value: true, label: weighedStateLabel(alternate) },
            ]}
            selected={useAlternate}
            onChange={(other) => setUseAlternate(other === true)}
          />
          <p className="app-caption">
            {weight === undefined || weight <= 0 || weighed === undefined
              ? 'Choose the state it was in when you weighed it.'
              : weighedConsequence(weight, weighed, weighed === picked ? alternate : picked)}
          </p>
        </>
      ) : null}
      <div className="app-gap-small" />
      <div className="app-row">
        <MmButton label="Add" kind="secondary" onPress={ready === undefined ? undefined : add} />
        <MmButton
          label={byNumbers ? 'Search instead' : 'Enter numbers instead'}
          kind="text"
          onPress={() => setByNumbers(!byNumbers)}
        />
      </div>
    </div>
  );
}
