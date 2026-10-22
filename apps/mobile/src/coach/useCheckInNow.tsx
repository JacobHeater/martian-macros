import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { nextCheckIn } from '../engine/nextCheckIn';
import type { RecalculationWithheldReason } from '../engine/RecalculationWithheldReason';
import { recalculationWithheld } from '../engine/recalculationWithheld';
import { displayTargets } from '../format/displayTargets';
import { Fmt } from '../format/Fmt';
import { useOverlays } from '../ui/useOverlays';
import { CheckInNowSheet } from './CheckInNowSheet';

/**
 * "Check in now" on the Coach (MM-559): why it is off, if it is, and
 * what pressing it does. It works the targets out again now from the
 * latest weigh-in, shows them beside the ones in force, and keeps them only
 * if the person says so. Undefined until what it reads is read.
 */
export function useCheckInNow():
  | { withheld: RecalculationWithheldReason | undefined; checkIn: () => Promise<void> }
  | undefined {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const snapshot = useCell(state.coach);
  const history = useLoaded(state.targetsHistory);
  const weights = useLoaded(state.weights);
  const pauses = useLoaded(state.pauses);
  const exact = useLoaded(state.exactTargets) ?? false;
  const today = useCell(state.today);
  if (setup === undefined || snapshot === undefined || history === undefined || weights === undefined || pauses === undefined) {
    return undefined;
  }
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  const withheld = recalculationWithheld({ weights, history, pauses, today });
  const checkIn = async () => {
    const current = history[history.length - 1];
    const next = state.checkIn.recalculation();
    if (current === undefined || next === undefined) {
      overlays.snack('Your targets cannot change right now.');
      return;
    }
    // Compared as shown (MM-123): a change too small to see is no change.
    const before = displayTargets(current.targets, { exact });
    const after = displayTargets(next.targets, { exact });
    if (
      before.kcal === after.kcal &&
      before.proteinG === after.proteinG &&
      before.proteinMinimumG === after.proteinMinimumG &&
      Math.abs(before.weeklyRateFraction - after.weeklyRateFraction) < 1e-6
    ) {
      overlays.snack('Checked in: your targets already match your latest weigh-in.');
      return;
    }
    const accepted = await overlays.sheet<boolean>('Check in', (close) => (
      <CheckInNowSheet
        current={current}
        next={next}
        weightText={fmt.weightHidden ? undefined : fmt.weight(snapshot.trendWeightKg)}
        exact={exact}
        onDone={close}
      />
    ));
    if (accepted !== true) return;
    await state.checkIn.acceptRecalculation(next);
    overlays.snack(`New targets in force. Next check-in ${Fmt.day(nextCheckIn(setup, next), today)}.`);
  };
  return { withheld, checkIn };
}
