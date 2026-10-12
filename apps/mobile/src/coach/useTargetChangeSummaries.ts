import { useEffect, useRef } from 'react';
import { hasUnseenChange } from '../state/hasUnseenChange';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useOverlays } from '../ui/useOverlays';
import { showTargetChangeSheet } from './showTargetChangeSheet';

/**
 * Shows the summary of each change to the targets the user has not seen,
 * oldest first, one at a time, and records each as seen once it is closed
 * (MM-138). A change made this launch waits until the next opening.
 */
export function useTargetChangeSummaries(): void {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const history = useLoaded(state.targetsHistory);
  const generatedThisLaunch = useCell(state.checkIn.generatedThisLaunch);
  const showing = useRef(false);

  useEffect(() => {
    if (history === undefined || showing.current) return;
    const index = history.findIndex(
      (record, i) => hasUnseenChange(record, history[i - 1]) && !generatedThisLaunch.has(record.effectiveFrom.epochDay),
    );
    const current = history[index];
    if (current === undefined) return;
    showing.current = true;
    void showTargetChangeSheet(overlays, services.targets, history.slice(0, index + 1), { isCurrent: false })
      .then(() => services.targets.markSummariesSeenThrough(current.effectiveFrom))
      .catch(() => {
        overlays.snack(
          'Could not finish the target summary. It will be available again when you reopen the app.',
        );
      })
      .finally(() => {
        showing.current = false;
      });
  }, [history, generatedThisLaunch, overlays, services]);
}
