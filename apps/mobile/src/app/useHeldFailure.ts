import { useCallback, useEffect, useState } from 'react';
import { Loadable } from '../state/Loadable';

/**
 * A read that went wrong, held while it is asked again (MM-183): the screen
 * keeps drawing what it drew without that read, and the notice's button
 * stays where it was, saying it is trying, instead of the screen going
 * blank while the read is under way. `failed` is true while the read has
 * gone wrong or is being asked again after it did; `pending` only while it
 * is being asked again.
 */
export function useHeldFailure(source: Loadable<unknown>, ask: () => void): {
  failed: boolean;
  pending: boolean;
  retry: () => void;
} {
  const [retrying, setRetrying] = useState(false);
  const failedNow = Loadable.hasFailed(source);
  const settled = source.ready || failedNow;
  useEffect(() => {
    if (retrying && settled) setRetrying(false);
  }, [retrying, settled]);
  const pending = retrying && !settled;
  const retry = useCallback(() => {
    setRetrying(true);
    ask();
  }, [ask]);
  return { failed: failedNow || pending, pending, retry };
}
