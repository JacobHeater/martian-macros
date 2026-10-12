/**
 * A value that arrives later: not ready until the first read of the store
 * has come back. "Ready, and there is none" is not the same as "not ready
 * yet", which is why this is not just `T | undefined`. A read that went
 * wrong is not ready either, and says what went wrong.
 */
export type Loadable<T> =
  | { readonly ready: false; readonly error?: unknown }
  | { readonly ready: true; readonly value: T };

export const Loadable = {
  loading: { ready: false } as const,

  of<T>(value: T): Loadable<T> {
    return { ready: true, value };
  },

  failed(error: unknown): { readonly ready: false; readonly error: unknown } {
    return { ready: false, error };
  },

  /** The value once ready; undefined until then. */
  valueOf<T>(loadable: Loadable<T>): T | undefined {
    return loadable.ready ? loadable.value : undefined;
  },

  /** Whether the read went wrong. */
  hasFailed<T>(loadable: Loadable<T>): boolean {
    return !loadable.ready && 'error' in loadable;
  },
} as const;
