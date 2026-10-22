import { useApp } from '../app/useApp';
import { healthDataTypeLabel } from '../format/healthDataTypeLabel';
import { healthPlatformName } from '../format/healthPlatformName';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import { useOverlays } from '../ui/useOverlays';

/**
 * Opens the health platform's own screen of this app's permissions
 * (MM-323): the one place to allow a kind it no longer asks about, or the
 * history it asks for only once (MM-73, MM-523). `wanted` is what the
 * person went there for. Back from it, what is allowed now is read, and a
 * snack says whether that changed, since the screen they come back to may
 * not show it. `onAllowed` runs once it is known to be allowed and before
 * the app redraws, so a caller that is about to go can move the focus
 * first. Where it cannot be opened, a snack says where to go.
 */
export function useOpenHealthPermissions(): (wanted: HealthDataType | 'history', onAllowed?: () => void) => Promise<void> {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const name = healthPlatformName(services.platform);
  return async (wanted, onAllowed) => {
    const { healthSource: source } = services;
    if (!(await source.openPermissions())) {
      overlays.snack(`${name} could not be opened from here. You can allow it in ${name}, from your phone’s settings.`);
      return;
    }
    const allowed =
      wanted === 'history'
        ? await source.historyPermitted().catch(() => false)
        : await source.permitted().then((permitted) => permitted.has(wanted), () => false);
    if (allowed) onAllowed?.();
    await state.syncHealth('asked');
    if (!allowed) overlays.snack('Nothing changed.');
    else overlays.snack(wanted === 'history' ? 'Past data allowed. The estimate will use it.' : `${healthDataTypeLabel(wanted)} allowed.`);
  };
}
