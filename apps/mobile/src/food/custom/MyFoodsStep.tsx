import { useState } from 'react';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import type { SavedMeal } from '../../domain/food/meal/SavedMeal';
import { Fmt } from '../../format/Fmt';
import { useApp } from '../../app/useApp';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmListRow } from '../../ui/MmListRow';
import { CustomFoodForm } from './CustomFoodForm';
import { SavedFoodTrustMark } from './SavedFoodTrustMark';
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
  /** Leaves the sheet for the Library, where saved foods are made, changed and deleted (MM-707). */
  onManage: () => void;
}

/**
 * The foods and meals the user saved, to log one (MM-45, MM-635, MM-645).
 * Making, changing and deleting them is the Library's (MM-706, MM-707);
 * only a food made for what is being logged, from a scanned label (MM-44)
 * or a corrected copy (MM-153), is still made here, since it goes on to be
 * logged.
 */
export function MyFoodsStep({ onBack, initialBarcode, draft, onPick, onPickMeal, onManage }: MyFoodsStepProps) {
  const { state } = useApp();
  const foods = useLoaded(state.customFoods) ?? [];
  const meals = useLoaded(state.savedMeals) ?? [];
  const [form, setForm] = useState(initialBarcode !== undefined || draft !== undefined);

  const formDone = (saved?: CustomFood) => {
    if (saved !== undefined) onPick(saved);
    else setForm(false);
  };
  if (form) return <CustomFoodForm initialBarcode={initialBarcode} draft={draft} onDone={formDone} />;
  return (
    <div className="food-sheet">
      <h2 className="app-headline">My foods</h2>
      <p className="app-caption">
        Press one to log it. What you save is also found first when you search.
      </p>
      <div className="app-gap-small" />
      {foods.length === 0 && meals.length === 0 ? <p className="app-text food-no-hits">Nothing saved yet. Make a food in the Library.</p> : null}
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
            />
          ))}
          {foods.length === 0 ? null : <p className="food-label food-label-spaced">Your foods and recipes</p>}
        </>
      )}
      {foods.map((food) => (
        <MmListRow
          key={food.id}
          title={food.name}
          detail={
            <span className="food-entry-text">
              <span className="food-entry-line">
                {`${food.kind === 'recipe' ? 'Recipe' : 'Food'} · ${food.servingDescription} · ${Fmt.kcal(food.perServing.kcal)}`}
              </span>
              {/* Where its numbers came from (MM-710). */}
              <SavedFoodTrustMark food={food} />
            </span>
          }
          // Pressing a saved food logs it (MM-635); it is changed or deleted in the Library (MM-707).
          opens
          onPress={() => onPick(food)}
        />
      ))}
      <div className="app-gap-small" />
      <MmButton label="Manage in Library" kind="text" onPress={onManage} />
      <MmButton label="Back" kind="text" onPress={onBack} />
    </div>
  );
}
