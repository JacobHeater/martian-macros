import { useContext } from 'react';
import type { Navigator } from './Navigator';
import { NavigatorContext } from './NavigatorContext';

/** The way to put another screen over this one. */
export function useNavigator(): Navigator {
  const navigator = useContext(NavigatorContext);
  if (navigator === undefined) throw new Error('No screen can be opened from here: NavigatorHost is not above it.');
  return navigator;
}
