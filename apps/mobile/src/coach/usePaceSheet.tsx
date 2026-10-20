import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useOverlays } from '../ui/useOverlays';
import { FatLossPace } from '../engine/FatLossPace';
import { Fmt } from '../format/Fmt';
import { paceName } from '../format/paceName';
import { PaceSheet } from './PaceSheet';

/**
 * Opens the choice of fat-loss pace (MM-128) and stores the answer: the
 * pace, and the day it was chosen, so the targets change at once. Returns
 * undefined when the coach cannot describe the paces yet.
 */
export function usePaceSheet(): (() => Promise<void>) | undefined {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const options = useCell(state.paceOptions);
  const snapshot = useCell(state.coach);
  const today = useCell(state.today);
  if (setup === undefined || options === undefined || snapshot === undefined) return undefined;
  const fmt = new Fmt(setup.unitSystem);
  return async () => {
    const chosen = await overlays.sheet<FatLossPace>('Choose a pace', (close) => (
      <PaceSheet
        options={options}
        current={FatLossPace.of(setup.requestedLossFraction)}
        weightKg={snapshot.trendWeightKg}
        fmt={fmt}
        onChoose={close}
      />
    ));
    if (chosen === undefined || chosen === FatLossPace.of(setup.requestedLossFraction)) return;
    await services.setup.saveSetup(
      setup.copyWith({ requestedLossFraction: FatLossPace.fraction(chosen), paceChangedOn: today }),
    );
    overlays.snack(`Pace set to ${paceName(chosen)}. Your targets change now, not at the next check-in.`);
  };
}
