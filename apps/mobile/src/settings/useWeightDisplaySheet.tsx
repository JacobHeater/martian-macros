import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import type { WeightDisplay } from '../domain/WeightDisplay';
import { weightDisplayLabel } from '../format/weightDisplayLabel';
import { useOverlays } from '../ui/useOverlays';
import { WeightDisplaySheet } from './WeightDisplaySheet';

/**
 * Opens the choice of weight display (MM-118) and keeps the answer. A
 * failed save says so and changes nothing. Gives whether one was chosen.
 */
export function useWeightDisplaySheet(): () => Promise<boolean> {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const current = useCell(state.weightDisplay);
  return async () => {
    const chosen = await overlays.sheet<WeightDisplay>('Weight display', (close) => (
      <WeightDisplaySheet current={current} onChoose={close} />
    ));
    if (chosen === undefined) return false;
    try {
      await services.preferences.saveWeightDisplay(chosen);
      overlays.snack(`Weight display: ${weightDisplayLabel(chosen)}.`);
    } catch {
      overlays.snack('The weight display could not be saved. Nothing was changed.');
    }
    return true;
  };
}
