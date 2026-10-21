import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import type { LeanGainPace } from '../domain/LeanGainPace';
import { leanGainPaceName } from '../format/leanGainPaceName';
import { useOverlays } from '../ui/useOverlays';
import { LeanGainPaceSheet } from './LeanGainPaceSheet';

/**
 * Opens the choice of lean-gain pace (MM-480) and stores the answer, so the
 * targets change at once, inside the weekly step. Returns undefined when
 * the coach cannot describe the paces yet.
 */
export function useLeanGainPaceSheet(): (() => Promise<void>) | undefined {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const options = useCell(state.leanGainPaceOptions);
  const today = useCell(state.today);
  if (setup === undefined || options === undefined) return undefined;
  return async () => {
    const chosen = await overlays.sheet<LeanGainPace>('Choose a gain pace', (close) => (
      <LeanGainPaceSheet options={options} current={setup.leanGainPace} onChoose={close} />
    ));
    if (chosen === undefined || chosen === setup.leanGainPace) return;
    await services.setup.saveSetup(setup.copyWith({ leanGainPace: chosen, paceChangedOn: today }));
    overlays.snack(`Gain pace set to ${leanGainPaceName(chosen)}. Your targets change now, within the weekly step.`);
  };
}
