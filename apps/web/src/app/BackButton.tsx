import { useContext } from 'react';
import { MmIconButton } from '../ui/MmIconButton';
import { CloseScreenContext } from './CloseScreenContext';

/** The way back from a pushed screen. Draws nothing on a screen that was not pushed. */
export function BackButton() {
  const close = useContext(CloseScreenContext);
  return close === undefined ? null : <MmIconButton icon="back" label="Back" onPress={close} />;
}
