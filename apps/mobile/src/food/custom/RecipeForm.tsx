import { Fragment, useEffect, useRef, useState } from 'react';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import type { RecipeIngredient } from '../../domain/food/custom/RecipeIngredient';
import { recipePerServing } from '../../domain/food/custom/recipePerServing';
import { recipeServingGrams } from '../../domain/food/custom/recipeServingGrams';
import { parseQuantity } from '../../domain/food/portion/parseQuantity';
import { Fmt } from '../../format/Fmt';
import { quantityText } from '../../format/quantityText';
import { moved } from '../../lang/moved';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useAsync } from '../../app/useAsync';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmMenuButton } from '../../ui/MmMenuButton';
import type { MmMenuItem } from '../../ui/MmMenuItem';
import { MmTextField } from '../../ui/MmTextField';
import { RecipeIngredientAdder } from './RecipeIngredientAdder';
import { RecipeLineWeight } from './RecipeLineWeight';
import '../food.css';

interface RecipeFormProps {
  /** The recipe being edited, or undefined for a new one. */
  recipe?: CustomFood | undefined;
  onDone: () => void;
}

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

const menuLabel = (line: RecipeIngredient) => `More actions for ${line.name}`;
const sourceKey = (line: RecipeIngredient) => (line.source === undefined ? '' : `${line.source.packId}:${line.source.foodId}`);

type LineAction = 'weight' | 'up' | 'down' | 'remove';

/**
 * What can be done to the line at `at` of `count`: change its weight, when it was found in a pack whose food is
 * still installed (`reweighable`, MM-456); move it, where there is room; or remove it (MM-45).
 */
const lineActions = (reweighable: boolean, at: number, count: number): MmMenuItem<LineAction>[] => [
  ...(reweighable ? [{ value: 'weight' as const, label: 'Change weight' }] : []),
  ...(at > 0 ? [{ value: 'up' as const, label: 'Move up' }] : []),
  ...(at < count - 1 ? [{ value: 'down' as const, label: 'Move down' }] : []),
  { value: 'remove', label: 'Remove' },
];

/**
 * Define a recipe: its ingredients, how many servings it makes, and
 * optionally the cooked weight of the whole pot (MM-45). One serving is the
 * summed ingredients divided by the servings. Ingredients are kept in the
 * order they are put in, and each line's menu moves or removes it. A line
 * found in a pack can have its weight changed in place (MM-456); its stored
 * totals are the record until then, whatever the pack later says.
 */
export function RecipeForm({ recipe, onDone }: RecipeFormProps) {
  const { services, state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const form = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(recipe?.name ?? '');
  const [servings, setServings] = useState(recipe === undefined ? '4' : quantityText(recipe.servings ?? 1));
  const [cooked, setCooked] = useState(
    recipe?.cookedWeightGrams === undefined ? '' : quantityText(recipe.cookedWeightGrams),
  );
  const [ingredients, setIngredients] = useState<readonly RecipeIngredient[]>(recipe?.ingredients ?? []);

  const servingCount = parseQuantity(servings);
  const cookedGrams = parseQuantity(cooked);
  const per = servingCount === undefined ? undefined : recipePerServing(ingredients, servingCount);
  const valid = name.trim() !== '' && ingredients.length > 0 && (per?.kcal ?? 0) > 0;

  // The found lines whose food is installed now: only they offer "Change weight" (MM-456).
  const installed = useAsync(async () => {
    const found = new Set<string>();
    if (catalog === undefined) return found;
    for (const line of ingredients) {
      if (line.source !== undefined && (await catalog.foodById(line.source.packId, line.source.foodId)) !== undefined) {
        found.add(sourceKey(line));
      }
    }
    return found;
  }, `${catalog?.packs.length ?? -1}:${ingredients.map(sourceKey).join(',')}`, { keep: true });

  const [reweighing, setReweighing] = useState<number>();
  // After a weight is saved or left, focus goes back to that line's menu button (MM-456).
  const [returnTo, setReturnTo] = useState<string>();
  useEffect(() => {
    if (returnTo === undefined) return;
    const button = [...(form.current?.querySelectorAll<HTMLElement>('button') ?? [])].find(
      (each) => each.getAttribute('aria-label') === returnTo,
    );
    button?.focus();
    setReturnTo(undefined);
  }, [returnTo]);
  const reweighed = (at: number, line?: RecipeIngredient) => {
    if (line !== undefined) setIngredients(ingredients.map((old, i) => (i === at ? line : old)));
    setReweighing(undefined);
    const now = line ?? ingredients[at];
    if (now !== undefined) setReturnTo(menuLabel(now));
  };

  const act = (at: number, action: LineAction) => {
    setReweighing(undefined);
    if (action === 'weight') setReweighing(at);
    else if (action === 'remove') setIngredients(ingredients.filter((_, i) => i !== at));
    else setIngredients(moved(ingredients, at, action === 'up' ? at - 1 : at + 1));
  };

  const save = async () => {
    if (servingCount === undefined || per === undefined) return;
    await services.customFoods.saveCustomFood(
      new CustomFood({
        id: recipe?.id ?? 0,
        name: name.trim(),
        kind: 'recipe',
        servingDescription: '1 serving',
        servingGrams: recipeServingGrams(cookedGrams, servingCount),
        perServing: per,
        servings: servingCount,
        cookedWeightGrams: cookedGrams,
        ingredients,
      }),
    );
    onDone();
  };

  return (
    <div ref={form} className="food-sheet">
      <h2 className="app-headline">{recipe === undefined ? 'Save a recipe' : 'Edit your recipe'}</h2>
      <MmTextField label="Name" value={name} onChange={setName} />
      <div className="app-gap-small" />
      <div className="food-fields">
        <MmTextField label="Makes servings" kind="quantity" value={servings} onChange={setServings} />
        <MmTextField label="Cooked weight g" kind="number" value={cooked} onChange={setCooked} />
      </div>
      <p className="app-caption">
        Optional: weigh the whole pot once it is cooked, so a serving can be logged by weight. Raw weights are not
        used, because cooking changes weight and not energy.
      </p>
      <div className="app-gap-small" />
      {ingredients.map((ingredient, i) => (
        <Fragment key={`${i}-${ingredient.name}`}>
          <MmListRow
            title={ingredient.name}
            subtitle={
              `${ingredient.grams === undefined ? '' : `${quantityText(ingredient.grams)} g · `}` +
              Fmt.kcal(ingredient.totals.kcal) +
              // A found line whose food has gone keeps its totals and says why it cannot be weighed again (MM-456).
              (ingredient.source !== undefined && installed !== undefined && !installed.has(sourceKey(ingredient))
                ? ' · food not installed'
                : '')
            }
            trailingAction={
              <MmMenuButton<LineAction>
                icon="more"
                label={menuLabel(ingredient)}
                items={lineActions(installed?.has(sourceKey(ingredient)) === true, i, ingredients.length)}
                onSelect={(action) => act(i, action)}
              />
            }
          />
          {reweighing === i ? <RecipeLineWeight line={ingredient} onDone={(line) => reweighed(i, line)} /> : null}
        </Fragment>
      ))}
      <RecipeIngredientAdder onAdd={(line) => setIngredients([...ingredients, line])} />
      <p className="app-subhead food-totals">
        {per === undefined || ingredients.length === 0
          ? 'Add ingredients to see one serving.'
          : `One serving: ${Fmt.kcal(per.kcal)} · ${whole(per.proteinG)} g protein · ` +
            `${whole(per.carbsG)} g carbs · ${whole(per.fatG)} g fat`}
      </p>
      <div className="app-gap" />
      <MmButton label="Save recipe" expand onPress={valid ? () => void save() : undefined} />
      <MmButton label="Cancel" kind="text" onPress={onDone} />
    </div>
  );
}
