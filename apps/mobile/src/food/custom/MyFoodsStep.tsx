import { useState } from 'react';
import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { Fmt } from '../../format/Fmt';
import { useApp } from '../../app/useApp';
import { useLoaded } from '../../app/useLoaded';
import { MmButton } from '../../ui/MmButton';
import { MmIconButton } from '../../ui/MmIconButton';
import { MmListRow } from '../../ui/MmListRow';
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
}

/** Which screen of "My foods" is showing. */
type MyFoodsPage = 'list' | 'foodForm' | 'recipeForm';

/** The foods and recipes the user saved: add, edit and delete them (MM-45). */
export function MyFoodsStep({ onBack, initialBarcode }: MyFoodsStepProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const foods = useLoaded(state.customFoods) ?? [];
  const [page, setPage] = useState<MyFoodsPage>(initialBarcode === undefined ? 'list' : 'foodForm');
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

  if (page === 'foodForm') return <CustomFoodForm food={editing} initialBarcode={barcode} onDone={() => show('list')} />;
  if (page === 'recipeForm') return <RecipeForm recipe={editing} onDone={() => show('list')} />;
  return (
    <div className="food-sheet">
      <h2 className="app-headline">My foods</h2>
      <p className="app-caption">Foods and recipes you save appear first when you search.</p>
      <div className="app-gap-small" />
      {foods.length === 0 ? <p className="app-text food-no-hits">Nothing saved yet.</p> : null}
      {foods.map((food) => (
        <MmListRow
          key={food.id}
          title={food.name}
          subtitle={
            `${food.kind === 'recipe' ? 'Recipe' : 'Food'} · ${food.servingDescription} · ` +
            Fmt.kcal(food.perServing.kcal)
          }
          onPress={() => show(food.kind === 'recipe' ? 'recipeForm' : 'foodForm', food)}
          trailingAction={<MmIconButton icon="delete" label={`Delete ${food.name}`} onPress={() => void remove(food)} />}
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
