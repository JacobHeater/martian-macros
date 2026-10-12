import { useContext } from 'react';
import { AppContext, type AppScope } from './AppContext';

/** The stores and the state worked out from them. */
export function useApp(): AppScope {
  const scope = useContext(AppContext);
  if (scope === undefined) throw new Error('This screen is outside the app: nothing gave it the stores.');
  return scope;
}
