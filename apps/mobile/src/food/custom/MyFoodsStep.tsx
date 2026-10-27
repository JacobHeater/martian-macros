import { useState } from 'react';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import type { SavedMeal } from '../../domain/food/meal/SavedMeal';
import { Fmt } from '../../format/Fmt';
import { useApp } from '../../app/useApp';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmMenuButton } from '../../ui/MmMenuButton';
import { useOverlays } from '../../ui/useOverlays';
import { CustomFoodForm } from './CustomFoodForm';
import { RecipeForm } from './RecipeForm';
import '../food.css';

interface MyFoodsStepProps {
  onBack: () => void;
  /**
   * Opens the new-food form for this product, so its label can be read and
   * the next scan finds it (MM-44).
   */
  initialBarcode?: string | undefined;
  /** A database food copied to be corrected (MM-153): the form opens on it. */
  draft?: CustomFood | undefined;
  /**
   * Logs a saved food (MM-635): pressing one opens its amount step, and a
   * food just made from a scanned label or a corrected copy comes back to be
   * logged.
   */
  onPick: (food: CustomFood) => void;
  /** Logs a saved meal's foods, at the meal and time of the sheet (MM-645). */
  onPickMeal: (meal: SavedMeal) => void;
}

/** Which screen of "My foods" is showing. */
type MyFoodsPage = 'list' | 'foodForm' | 'recipeForm';

/** The foods and recipes the user saved: add, edit and delete them (MM-45). */
export function MyFoodsStep({ onBack, initialBarcode, draft, onPick, onPickMeal }: MyFoodsStepProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const foods = useLoaded(state.customFoods) ?? [];
  const meals = useLoaded(state.savedMeals) ?? [];

  const removeMeal = async (meal: SavedMeal) => {
    const ok = await overlays.confirm({
      title: `Delete ${meal.name}?`,
      message: 'What you already logged from it stays as it is. This only removes it from your saved meals.',
      confirmLabel: 'Delete',
    });
    if (ok) await services.savedMeals.deleteSavedMeal(meal.id);
  };
  const [page, setPage] = useState<MyFoodsPage>(initialBarcode === undefined && draft === undefined ? 'list' : 'foodForm');
  const [editing, setEditing] = useState<CustomFood>();
  const [barcode, setBarcode] = useState(initialBarcode);

  const show = (next: MyFoodsPage, food?: CustomFood) => {
    setPage(next);
    setEditing(food);
    setBarcode(undefined);
  };

  const remove = async (food: CustomFood) => {
    const ok = await overlays.confirm({
      title: `Delete ${food.name}?`,
      message:
        'Entries you already logged from it stay as they are. This only removes it from your saved foods.',
      confirmLabel: 'Delete',
    });
    if (ok) await services.customFoods.deleteCustomFood(food.id);
  };

  // A food made for what was being logged (a scanned label, a corrected copy) goes on to be logged (MM-635).
  const madeToLog = initialBarcode !== undefined || draft !== undefined;
  const formDone = (saved?: CustomFood) => {
    if (saved !== undefined && editing === undefined && madeToLog) onPick(saved);
    else show('list');
  };
  if (page === 'foodForm') return <CustomFoodForm food={editing} initialBarcode={barcode} draft={editing === undefined ? draft : undefined} onDone={formDone} />;
  if (page === 'recipeForm') return <RecipeForm recipe={editing} onDone={() => show('list')} />;
  return (
    <div className="food-sheet">
      <h2 className="app-headline">My foods</h2>
      <p className="app-caption">
        Press one to log it. What you save here is also found first when you search.
      </p>
      <div className="app-gap-small" />
      {foods.length === 0 && meals.length === 0 ? <p className="app-text food-no-hits">Nothing saved yet.</p> : null}
      {/* The meals saved to log again, each its foods in one press (MM-645), apart from the foods. */}
      {meals.length === 0 ? null : (
        <>
          <p className="food-label food-label-spaced">Your meals</p>
          {meals.map((meal) => (
            <MmListRow
              key={`meal-${meal.id}`}
              title={meal.name}
              // What the press does, said: it logs the foods (the UX guard's UX-1).
              subtitle={`Meal · logs ${meal.foods.length === 1 ? '1 food' : `${meal.foods.length} foods`} · ${Fmt.kcal(meal.foods.reduce((sum, f) => sum + f.kcal, 0))}`}
              // Pressed, it logs at once, as a recent meal does: nothing opens, so no chevron.
              onPress={() => onPickMeal(meal)}
              trailingAction={
                <MmMenuButton<'delete'>
                  icon="more"
                  label={`More actions for ${meal.name}`}
                  items={[{ value: 'delete', label: 'Delete' }]}
                  onSelect={() => void removeMeal(meal)}
                />
              }
            />
          ))}
          {foods.length === 0 ? null : <p className="food-label food-label-spaced">Your foods and recipes</p>}
        </>
      )}
      {foods.map((food) => (
        <MmListRow
          key={food.id}
          title={food.name}
          subtitle={
            `${food.kind === 'recipe' ? 'Recipe' : 'Food'} · ${food.servingDescription} · ` +
            Fmt.kcal(food.perServing.kcal)
          }
          // Pressing a saved food logs it; its editing and deleting are in its menu (MM-635).
          opens
          onPress={() => onPick(food)}
          trailingAction={
            <MmMenuButton<'edit' | 'delete'>
              icon="more"
              label={`More actions for ${food.name}`}
              items={[
                { value: 'edit', label: 'Edit' },
                { value: 'delete', label: 'Delete' },
              ]}
              onSelect={(action) => (action === 'edit' ? show(food.kind === 'recipe' ? 'recipeForm' : 'foodForm', food) : void remove(food))}
            />
          }
        />
      ))}
      <div className="app-gap-small" />
      <MmButton label="New food" kind="secondary" icon="plus" expand onPress={() => show('foodForm')} />
      <div className="app-gap-small" />
      <MmButton label="New recipe" kind="secondary" icon="plus" expand onPress={() => show('recipeForm')} />
      <MmButton label="Back" kind="text" onPress={onBack} />
    </div>
  );
}
