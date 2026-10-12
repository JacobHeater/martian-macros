/**
 * `store` with some of its methods replaced. A store is an object of a
 * class, so its methods are not copied by spreading it; this keeps them.
 */
export function overriding<T extends object>(store: T, replaced: Partial<T>): T {
  return Object.assign(Object.create(store) as T, replaced);
}
