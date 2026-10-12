import type { Unsubscribe } from './Unsubscribe';

/**
 * A value that changes over time: what a repository's `watch...` returns.
 * A subscriber is given the current value, then each new one, until it
 * unsubscribes. This is the part of a Dart `Stream` the app used.
 */
export interface Watched<T> {
  subscribe(listener: (value: T) => void, onError?: (error: unknown) => void): Unsubscribe;
}
