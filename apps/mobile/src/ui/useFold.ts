import { useCallback, useContext, useState } from 'react';
import { MmFoldsContext } from './MmFoldsContext';

/**
 * Whether a fold is open (MM-286): as it was left, when `remember` names it
 * and the app keeps folds; otherwise `initial`. Setting it tells the app,
 * so the next visit finds it so.
 */
export function useFold(remember: string | undefined, initial: boolean): [expanded: boolean, setExpanded: (next: boolean) => void] {
  const folds = useContext(MmFoldsContext);
  const [expanded, setExpanded] = useState((remember === undefined ? undefined : folds?.get(remember)) ?? initial);
  const set = useCallback(
    (next: boolean) => {
      setExpanded(next);
      if (remember !== undefined) folds?.set(remember, next);
    },
    [folds, remember],
  );
  return [expanded, set];
}
