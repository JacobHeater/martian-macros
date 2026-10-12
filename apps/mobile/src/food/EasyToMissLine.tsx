import { useEffect } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { easyToMissVisible } from '../domain/food/easyToMiss/easyToMissVisible';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmActionChip } from '../ui/MmActionChip';
import { useOverlays } from '../ui/useOverlays';
import { showAddFoodSheet } from './showAddFoodSheet';

/**
 * One line under a day marked complete that names the things people most
 * often forget to log (MM-152). A prompt, never a gate: the day is already
 * stored as complete. It fades after the first two weeks, and is never
 * shown to someone who turned it off or with an eating-disorder history.
 * `day` is the day being viewed, which new entries are logged to.
 */
export function EasyToMissLine({ day }: { day: CalendarDate }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const preference = useLoaded(state.easyToMiss);
  const today = useCell(state.today);
  const underEating = useCell(state.underEatingFinding);
  const visible =
    setup !== undefined &&
    preference !== undefined &&
    easyToMissVisible({
      today,
      onboardedOn: setup.onboardedOn,
      preference,
      // Not for someone with an eating-disorder history, or while their
      // logged days sit far below the floor (MM-114): a prompt to find more
      // calories to record is the wrong emphasis.
      suppressed: setup.screening.eatingDisorderHistory || underEating !== undefined,
    });
  const lastShown = preference?.lastShown;

  // Showing it is recorded, once a day.
  useEffect(() => {
    if (visible && lastShown !== today) void services.preferences.markEasyToMissShown(today);
  }, [visible, lastShown, today, services]);

  if (!visible) return null;
  return (
    <div className="food-easy-to-miss">
      <p className="food-label">Easy to miss</p>
      <div className="app-row">
        <MmActionChip label="cooking oil" onPress={() => void showAddFoodSheet(overlays, day, { initialQuery: 'oil' })} />
        <MmActionChip label="drinks" onPress={() => void showAddFoodSheet(overlays, day, { initialQuery: 'drink' })} />
        <MmActionChip label="sauces" onPress={() => void showAddFoodSheet(overlays, day, { initialQuery: 'sauce' })} />
        <MmActionChip
          label="bites and tastes"
          onPress={() => void showAddFoodSheet(overlays, day, { estimateSize: 'light' })}
        />
      </div>
    </div>
  );
}
