/**
 * A value that arrives later: not ready until the first read of the store
 * has come back. "Ready, and there is none" is not the same as "not ready
 * yet", which is why this is not just `T | undefined`.
 */
export type Loadable<T> = { readonly ready: false } | { readonly ready: true; readonly value: T };

export const Loadable = {
  loading: { ready: false } as const,

  of<T>(value: T): Loadable<T> {
    return { ready: true, value };
  },

  /** The value once ready; undefined until then. */
  valueOf<T>(loadable: Loadable<T>): T | undefined {
    return loadable.ready ? loadable.value : undefined;
  },
} as const;
