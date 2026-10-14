import type { DailyTargets } from '../engine/DailyTargets';
import { Fmt } from '../format/Fmt';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { showTargetChangeSheet } from './showTargetChangeSheet';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

function proteinRange(targets: DailyTargets): string {
  const minimum = targets.proteinMinimumG;
  return minimum === undefined ? `${whole(targets.proteinG)}` : `${whole(minimum)}–${whole(targets.proteinG)}`;
}

/**
 * Every set of targets the user has had, newest first. Each opens the
 * reasons it was issued with (MM-138).
 */
export function TargetsHistoryScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const history = useLoaded(state.targetsHistory) ?? [];
  const today = useCell(state.today);
  return (
    <Screen title="Target history">
      {history.length === 0 ? (
        <p className="app-text">No targets yet.</p>
      ) : (
        history
          .map((record, i) => (
            <MmListRow
              key={record.effectiveFrom.epochDay}
              title={Fmt.day(record.effectiveFrom, today)}
              subtitle={
                `${Fmt.kcal(record.targets.kcal)} · P ${proteinRange(record.targets)} · ` +
                `C ${whole(record.targets.carbsG)} · F ${whole(record.targets.fatG)}` +
                `${record.targets.flags.has('heldByUser') ? ' · Kept by you' : ''}`
              }
              opens
              onPress={() =>
                void showTargetChangeSheet(overlays, services.targets, history.slice(0, i + 1), {
                  isCurrent: i === history.length - 1,
                })
              }
            />
          ))
          .reverse()
      )}
    </Screen>
  );
}
