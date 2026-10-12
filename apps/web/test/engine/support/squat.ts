import { builtInExercises, type Exercise } from '../../../src/domain';

/** The back squat from the built-in library, for tests that need a real exercise. */
export const squat: Exercise = (() => {
  const found = builtInExercises.find((e) => e.id === 'back-squat');
  if (found === undefined) throw new Error('The library has no back squat.');
  return found;
})();
