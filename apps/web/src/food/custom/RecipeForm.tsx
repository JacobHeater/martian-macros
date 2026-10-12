import { useState } from 'react';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import type { RecipeIngredient } from '../../domain/food/custom/RecipeIngredient';
import { recipePerServing } from '../../domain/food/custom/recipePerServing';
import { recipeServingGrams } from '../../domain/food/custom/recipeServingGrams';
import { parseQuantity } from '../../domain/food/portion/parseQuantity';
import { Fmt } from '../../format/Fmt';
import { quantityText } from '../../format/quantityText';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { MmButton } from '../../ui/MmButton';
import { MmIconButton } from '../../ui/MmIconButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmTextField } from '../../ui/MmTextField';
import { RecipeIngredientAdder } from './RecipeIngredientAdder';
import '../food.css';

interface RecipeFormProps {
  /** The recipe being edited, or undefined for a new one. */
  recipe?: CustomFood | undefined;
  onDone: () => void;
}

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * Define a recipe: its ingredients, how many servings it makes, and
 * optionally the cooked weight of the whole pot (MM-45). One serving is the
 * summed ingredients divided by the servings.
 */
export function RecipeForm({ recipe, onDone }: RecipeFormProps) {
  const { services } = useApp();
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
    <div className="food-sheet">
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
        <MmListRow
          key={`${i}-${ingredient.name}`}
          title={ingredient.name}
          subtitle={
            `${ingredient.grams === undefined ? '' : `${quantityText(ingredient.grams)} g · `}` +
            Fmt.kcal(ingredient.totals.kcal)
          }
          trailingAction={
            <MmIconButton
              icon="close"
              label={`Remove ${ingredient.name}`}
              onPress={() => setIngredients(ingredients.filter((_, at) => at !== i))}
            />
          }
        />
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
