import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { FatLossPace } from '../engine/FatLossPace';
import { Fmt } from '../format/Fmt';
import { whatToExpectPoints } from '../format/whatToExpectPoints';
import { WhatToExpectPoints } from '../onboarding/WhatToExpectPoints';
import { Screen } from '../app/Screen';

/** "What to expect", reread from the Coach tab any time (MM-158), from the goal and pace in force now. */
export function WhatToExpectScreen() {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const setup = useLoaded(state.setup);
  const snapshot = useCell(state.coach);
  const current = useCell(state.currentTargets);
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  const weightKg = snapshot?.trendWeightKg ?? 0;
  const paceFraction =
    current !== undefined
      ? Math.abs(current.targets.weeklyRateFraction)
      : setup.goalMode === 'fatLoss'
        ? FatLossPace.fraction(FatLossPace.of(setup.requestedLossFraction) ?? FatLossPace.default)
        : 0;
  const points = whatToExpectPoints({
    goal: setup.goalMode,
    paceFraction,
    weightKg,
    sex: setup.profile.sex,
    menstruates: setup.profile.sex === 'female' && !setup.screening.menopause,
    fmt,
  });
  return (
    <Screen title="What to expect" roomy>
      <WhatToExpectPoints points={points} />
    </Screen>
  );
}
