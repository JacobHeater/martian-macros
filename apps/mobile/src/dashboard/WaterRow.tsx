import { useRef } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterServing } from '../domain/water/WaterServing';
import { waterAmount } from '../format/waterAmount';
import { logWater } from '../food/logWater';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';

/**
 * Today's water on the Dashboard (MM-313): the total and the goal when one
 * is set, and a glass added in one tap from the row's own labelled action,
 * the in-place pattern of MM-301. The row opens nothing, so the action is
 * its only control (the panel's PD-4, UX-3); the day's drinks are on Food.
 * The snack says the new total and offers Undo.
 */
export function WaterRow({ today }: { today: CalendarDate }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const entries = useLoaded(state.waterForDay(today)) ?? [];
  const goal = (useLoaded(state.nutritionGoals) ?? NutritionGoals.none).waterGoalMl;
  const units = setup?.unitSystem ?? 'metric';
  const total = entries.reduce((sum, e) => sum + e.ml, 0);
  /** Water added by taps the list has not caught up with, so a quick second tap says the right total. */
  const pending = useRef({ seen: total, ml: 0 });
  if (pending.current.seen !== total) pending.current = { seen: total, ml: 0 };

  const addGlass = async () => {
    const ml = WaterServing.ml('glass', units);
    pending.current.ml += ml;
    const after = pending.current.seen + pending.current.ml;
    const id = await logWater(services.water, services.clock, today, ml);
    overlays.snack(`Added a glass: ${waterAmount(after, units)} today`, {
      label: 'Undo',
      onAction: () => void services.water.removeWater(id),
    });
  };

  return (
    <MmListRow
      leadingIcon="water"
      title={entries.length === 0 ? 'No water yet today' : `${waterAmount(total, units)} today`}
      subtitle={goal === undefined ? 'Water' : `Water · of ${waterAmount(goal, units)}`}
      trailingAction={
        <MmButton label="Add a glass" name="Add a glass of water" kind="text" icon="plus" onPress={() => void addGlass()} />
      }
    />
  );
}
