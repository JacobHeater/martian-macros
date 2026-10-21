import { useEffect } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';

/**
 * The phone's lock over a screen that shows progress photos (MM-157): asked
 * when the screen opens unless another photo screen already passed it,
 * locked again when the app goes to the background, and asked again on the
 * way back. Gives whether the photos may show, and the way to ask again.
 */
export function usePhotoLock(): { status: 'asking' | 'open' | 'locked'; unlock: () => void } {
  const { state } = useApp();
  const lock = state.photoLock;
  useEffect(() => lock.enter(), [lock]);
  useEffect(() => {
    const changed = () => (document.visibilityState === 'hidden' ? lock.away() : lock.back());
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, [lock]);
  return { status: useCell(lock.status), unlock: () => void lock.unlock() };
}
