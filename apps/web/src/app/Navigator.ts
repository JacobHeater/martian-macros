import type { ReactNode } from 'react';

/** Puts a screen over the one showing, and takes it away again. */
export interface Navigator {
  /**
   * Shows what `screen` draws over everything else. It answers with what
   * the screen closed with, or undefined when it was simply left.
   */
  push<T = void>(screen: (close: (result?: T) => void) => ReactNode): Promise<T | undefined>;

  /** Closes every pushed screen, back to what is underneath them all. Each answers as simply left. */
  closeAll(): void;

  /** How many pushed screens there are. */
  readonly depth: number;
}
