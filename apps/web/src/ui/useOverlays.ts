import { useContext } from 'react';
import type { Overlays } from './Overlays';
import { OverlaysContext } from './OverlaysContext';

/** The questions and messages this screen can show over itself. */
export function useOverlays(): Overlays {
  const overlays = useContext(OverlaysContext);
  if (overlays === undefined) throw new Error('Nothing here can show a dialog: MmOverlays is not above this screen.');
  return overlays;
}
