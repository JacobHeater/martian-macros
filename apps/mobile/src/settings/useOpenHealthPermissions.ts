import { useApp } from '../app/useApp';
import { healthPlatformName } from '../format/healthPlatformName';
import { useOverlays } from '../ui/useOverlays';

/**
 * Opens the health platform's own screen of this app's permissions
 * (MM-323): the one place to allow a kind it no longer asks about, or the
 * history it asks for only once (MM-73, MM-523). Back from it, what is
 * allowed now is read. Where it cannot be opened, a snack says where to go.
 */
export function useOpenHealthPermissions(): () => Promise<void> {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const name = healthPlatformName(services.platform);
  return async () => {
    if (await services.healthSource.openPermissions()) {
      await state.syncHealth('asked');
      return;
    }
    overlays.snack(`${name} could not be opened from here. You can allow it in ${name}, from your phone’s settings.`);
  };
}
