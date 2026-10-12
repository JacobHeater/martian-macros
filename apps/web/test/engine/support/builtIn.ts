import { builtInExercises, type Exercise } from '../../../src/domain';

/** The built-in exercise with `id`; the test fails loudly if the library has none. */
export function builtIn(id: string): Exercise {
  const found = builtInExercises.find((e) => e.id === id);
  if (found === undefined) throw new Error(`The library has no ${id}.`);
  return found;
}
