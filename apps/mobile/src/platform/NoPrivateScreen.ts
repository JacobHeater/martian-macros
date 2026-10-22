import type { PrivateScreen } from '../domain/integration/PrivateScreen';

/** Off the phone (the development build): nothing to hide the screen from (MM-157). */
export class NoPrivateScreen implements PrivateScreen {
  hide(): () => void {
    return () => undefined;
  }
}
