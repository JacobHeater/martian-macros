import { canHoldReduction } from '../engine/canHoldReduction';
import { holdReduction } from '../engine/holdReduction';
import type { TargetsHistoryWriter } from '../engine/TargetsHistoryWriter';
import type { TargetsRecord } from '../engine/TargetsRecord';
import type { Overlays } from '../ui/Overlays';
import { TargetChangeSheet } from './TargetChangeSheet';

/**
 * Opens the account of the last record in `history`. If it is the user's
 * current targets and an ordinary reduction that may be held once, the
 * sheet offers to keep last week's targets, and doing so replaces the
 * record (MM-138). Pass `isCurrent` false for an older record from the
 * history.
 */
export function showTargetChangeSheet(
  overlays: Overlays,
  writer: TargetsHistoryWriter,
  history: readonly TargetsRecord[],
  { isCurrent = true }: { isCurrent?: boolean } = {},
): Promise<void> {
  const current = history[history.length - 1];
  if (current === undefined) return Promise.resolve();
  const mayHold = isCurrent && canHoldReduction(history);
  return overlays
    .sheet<void>('Why your targets are what they are', (close) => (
      <TargetChangeSheet
        current={current}
        previous={history[history.length - 2]}
        onHold={
          mayHold
            ? () => {
                close();
                void writer.saveTargets(holdReduction(history));
              }
            : undefined
        }
      />
    ))
    .then(() => undefined);
}
