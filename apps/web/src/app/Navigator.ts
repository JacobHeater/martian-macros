import type { ReactNode } from 'react';

/** Puts a screen over the one showing, and takes it away again. */
export interface Navigator {
  /**
   * Shows what `screen` draws over everything else. It answers with what
   * the screen closed with, or undefined when it was simply left.
   */
  push<T = void>(screen: (close: (result?: T) => void) => ReactNode): Promise<T | undefined>;

  /** Whether a pushed screen is showing. */
  readonly depth: number;
}
