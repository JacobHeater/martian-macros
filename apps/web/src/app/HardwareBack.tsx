import { useEffect } from 'react';
import { leaveApp } from '../platform/leaveApp';
import { onHardwareBack } from '../platform/onHardwareBack';
import { useOverlays } from '../ui/useOverlays';
import { useNavigator } from './useNavigator';

/**
 * The phone's own back button (MM-232): it answers the question on top as
 * its scrim would, then closes the screen on top, and from the home screen
 * it puts the app in the background, as the Flutter app did.
 */
export function HardwareBack() {
  const overlays = useOverlays();
  const navigator = useNavigator();
  useEffect(
    () =>
      onHardwareBack(() => {
        if (overlays.closeTop()) return;
        if (navigator.closeTop()) return;
        leaveApp();
      }),
    [overlays, navigator],
  );
  return null;
}
