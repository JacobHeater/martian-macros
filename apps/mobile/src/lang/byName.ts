import { ArgumentError } from './ArgumentError';

/**
 * The member of `values` called `name`. Throws when there is none, so a
 * stored value that is not one of an enum's can never pass for one. Dart's
 * `values.byName`.
 */
export function byName<T extends string>(values: readonly T[], name: unknown): T {
  const found = values.find((value) => value === name);
  if (found === undefined) throw new ArgumentError(`No such value: ${String(name)}`);
  return found;
}
