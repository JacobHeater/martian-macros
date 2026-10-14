import type { CalendarDate } from '../domain/CalendarDate';
import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterServing } from '../domain/water/WaterServing';
import { waterAmount } from '../format/waterAmount';
import { logWater } from '../food/logWater';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';

interface WaterRowProps {
  today: CalendarDate;
  /** Opens the Food screen, where the day's water is. */
  onOpen: () => void;
}

/**
 * Today's water on the Dashboard (MM-313): the total and the goal when one
 * is set, and a glass added in one tap from the row's own action, the
 * in-place pattern of MM-301. The snack says the new total and offers Undo.
 */
export function WaterRow({ today, onOpen }: WaterRowProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const entries = useLoaded(state.waterForDay(today)) ?? [];
  const goal = (useLoaded(state.nutritionGoals) ?? NutritionGoals.none).waterGoalMl;
  const units = setup?.unitSystem ?? 'metric';
  const total = entries.reduce((sum, e) => sum + e.ml, 0);

  const addGlass = async () => {
    const ml = WaterServing.ml('glass', units);
    const id = await logWater(services.water, services.clock, today, ml);
    overlays.snack(`Added a glass: ${waterAmount(total + ml, units)} today`, {
      label: 'Undo',
      onAction: () => void services.water.removeWater(id),
    });
  };

  return (
    <MmListRow
      leadingIcon="water"
      title={entries.length === 0 ? 'No water yet today' : `${waterAmount(total, units)} today`}
      subtitle={goal === undefined ? 'Water' : `Water · of ${waterAmount(goal, units)}`}
      opens
      onPress={onOpen}
      trailingAction={<MmIconButton icon="plus" label="Add a glass of water" onPress={() => void addGlass()} />}
    />
  );
}
