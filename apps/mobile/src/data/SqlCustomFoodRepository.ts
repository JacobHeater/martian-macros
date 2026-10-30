import { CustomFood } from '../domain/food/custom/CustomFood';
import { CustomFoodKind } from '../domain/food/custom/CustomFoodKind';
import type { FoodIngredient } from '../domain/food/custom/FoodIngredient';
import type { RecipeIngredient } from '../domain/food/custom/RecipeIngredient';
import { FoodGroup } from '../domain/food/FoodGroup';
import { FoodEvidenceKind } from '../domain/food/meal/FoodEvidenceKind';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { integer, named, number, optionalInteger, optionalNamed, optionalNumber, optionalText, orNull, text } from './columns';
import { insert } from './insert';
import { update } from './update';
import { microsFromRow } from './microsFromRow';
import { microsValues } from './microsValues';

const totalsOf = (r: SqlRow) =>
  new NutritionTotals({
    kcal: number(r, 'kcal'),
    proteinG: number(r, 'protein_g'),
    carbsG: number(r, 'carbs_g'),
    fatG: number(r, 'fat_g'),
  });

const both = ['custom_foods', 'recipe_ingredients'] as const;

/** What went into a homemade food (MM-710), kept as a JSON list of name and grams; nothing when the column is empty or not a list. */
function madeOfIn(json: string | undefined): FoodIngredient[] {
  if (json === undefined) return [];
  try {
    const value: unknown = JSON.parse(json);
    if (!Array.isArray(value)) return [];
    return value.flatMap((line): FoodIngredient[] => {
      if (typeof line !== 'object' || line === null) return [];
      const { name, grams } = line as { name?: unknown; grams?: unknown };
      return typeof name === 'string' && name !== '' ? [{ name, grams: typeof grams === 'number' && Number.isFinite(grams) ? grams : undefined }] : [];
    });
  } catch {
    return [];
  }
}

/** Where a saved food's numbers came from (MM-710); none for a food saved before it was kept. */
function evidenceOf(r: SqlRow): CustomFood['evidence'] {
  const kind = optionalNamed(FoodEvidenceKind.values, r, 'evidence_kind');
  return kind === undefined ? undefined : { kind, citation: optionalText(r, 'evidence_citation') };
}

/** `CustomFoodRepository` kept in the database. Ids are never reused. */
export class SqlCustomFoodRepository implements CustomFoodRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchCustomFoods(): Watched<CustomFood[]> {
    return this.db.watch(both, async (db) => {
      const rows = await db.select('SELECT * FROM custom_foods ORDER BY name, id');
      const lines = await db.select('SELECT * FROM recipe_ingredients ORDER BY position');
      const byRecipe = new Map<number, RecipeIngredient[]>();
      for (const l of lines) {
        const recipeId = integer(l, 'recipe_id');
        const packId = optionalText(l, 'source_pack_id');
        const foodId = optionalInteger(l, 'source_food_id');
        const ingredient: RecipeIngredient = {
          name: text(l, 'name'),
          grams: optionalNumber(l, 'grams'),
          totals: totalsOf(l),
          source: packId === undefined || foodId === undefined ? undefined : { packId, foodId },
        };
        const ingredients = byRecipe.get(recipeId);
        if (ingredients === undefined) byRecipe.set(recipeId, [ingredient]);
        else ingredients.push(ingredient);
      }
      return rows.map(
        (r) =>
          new CustomFood({
            id: integer(r, 'id'),
            name: text(r, 'name'),
            kind: named(CustomFoodKind.values, r, 'kind'),
            servingDescription: text(r, 'serving_description'),
            servingGrams: optionalNumber(r, 'serving_grams'),
            perServing: totalsOf(r),
            barcode: optionalText(r, 'barcode'),
            servings: optionalNumber(r, 'servings'),
            cookedWeightGrams: optionalNumber(r, 'cooked_weight_grams'),
            ingredients: byRecipe.get(integer(r, 'id')) ?? [],
            fiberG: optionalNumber(r, 'fiber_g'),
            sugarAlcoholsG: optionalNumber(r, 'sugar_alcohols_g'),
            micros: microsFromRow(r),
            group: FoodGroup.fromName(optionalText(r, 'food_group')),
            evidence: evidenceOf(r),
            madeOf: madeOfIn(optionalText(r, 'ingredients')),
          }),
      );
    });
  }

  saveCustomFood(food: CustomFood): Promise<number> {
    return this.db.write(both, async (db) => {
      const row = {
        name: food.name,
        kind: food.kind,
        serving_description: food.servingDescription,
        serving_grams: orNull(food.servingGrams),
        kcal: food.perServing.kcal,
        protein_g: food.perServing.proteinG,
        carbs_g: food.perServing.carbsG,
        fat_g: food.perServing.fatG,
        barcode: orNull(food.barcode),
        servings: orNull(food.servings),
        cooked_weight_grams: orNull(food.cookedWeightGrams),
        fiber_g: orNull(food.fiberG),
        sugar_alcohols_g: orNull(food.sugarAlcoholsG),
        sodium_mg: orNull(food.micros.of('sodium')),
        ...microsValues(food.micros),
        food_group: orNull(food.group),
        evidence_kind: orNull(food.evidence?.kind),
        evidence_citation: orNull(food.evidence?.citation),
        ingredients: food.madeOf.length === 0 ? null : JSON.stringify(food.madeOf.map((line) => ({ name: line.name, grams: line.grams }))),
      };
      let id = food.id;
      if (id === 0) {
        id = await insert(db, 'custom_foods', row);
      } else {
        await update(db, 'custom_foods', row, { column: 'id', value: id });
        await db.execute('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      }
      let position = 0;
      for (const i of food.ingredients) {
        await insert(db, 'recipe_ingredients', {
          recipe_id: id,
          position: position++,
          name: i.name,
          grams: orNull(i.grams),
          kcal: i.totals.kcal,
          protein_g: i.totals.proteinG,
          carbs_g: i.totals.carbsG,
          fat_g: i.totals.fatG,
          source_pack_id: orNull(i.source?.packId),
          source_food_id: orNull(i.source?.foodId),
        });
      }
      return id;
    });
  }

  deleteCustomFood(id: number): Promise<void> {
    return this.db.write(both, async (db) => {
      await db.execute('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      await db.execute('DELETE FROM custom_foods WHERE id = ?', [id]);
    });
  }
}
