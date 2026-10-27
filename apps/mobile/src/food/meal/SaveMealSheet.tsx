import { useState } from 'react';
import type { FoodEntry } from '../../domain/FoodEntry';
import { Fmt } from '../../format/Fmt';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { MmButton } from '../../ui/MmButton';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
import { useOverlays } from '../../ui/useOverlays';
import { savedMealName } from './savedMealName';
import '../food.css';

interface SaveMealSheetProps {
  foods: readonly FoodEntry[];
  onDone: () => void;
}

/**
 * Saves some foods as a meal to log again in one press (MM-645): its name,
 * what it holds, and Save. The foods are kept as they are; logged again,
 * they are loose, at the meal and time chosen then.
 */
export function SaveMealSheet({ foods, onDone }: SaveMealSheetProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const [name, setName] = useState(() => savedMealName(foods));
  const [failed, setFailed] = useState(false);
  const kcal = foods.reduce((sum, food) => sum + food.kcal, 0);
  const typed = name.trim();
  const save = async () => {
    try {
      await services.savedMeals.saveMeal(typed, foods, today);
    } catch {
      setFailed(true);
      // Said as well as shown (the UX guard's follow-up).
      overlays.snack('The meal could not be saved. Press Save meal to try again.');
      return;
    }
    overlays.snack(`${typed} saved. Log it again from Saved.`);
    onDone();
  };
  return (
    <div className="food-sheet">
      <h2 className="app-headline">Save as a meal</h2>
      <p className="app-caption">{`${foods.length === 1 ? '1 food' : `${foods.length} foods`} · ${Fmt.kcal(kcal)}. Logged again from Saved in one press, at the meal and time you choose then.`}</p>
      <div className="app-gap-small" />
      <MmTextField label="Meal name" value={name} onChange={setName} helper={typed === '' ? 'A name is needed.' : undefined} />
      <div className="app-gap" />
      {failed ? <Notice icon="warning" text="The meal could not be saved. Press Save meal to try again." /> : null}
      <MmButton label="Save meal" icon="check" expand onPress={typed === '' ? undefined : () => save()} />
    </div>
  );
}
