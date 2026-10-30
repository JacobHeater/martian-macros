import type { CustomFood } from '../../domain/food/custom/CustomFood';

/**
 * Whether to keep the Library foods that came with a copy (MM-715), asked once the foods are confirmed: which
 * they are, what saving them gives, and that one this phone already has by name is kept as it is.
 */
export function libraryFoodsWords(arrived: readonly CustomFood[], alreadyHere: readonly CustomFood[]): string {
  const names = arrived.map((food) => food.name);
  const listed = names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const came = `${listed} came from your other phone’s Library`;
  const kept =
    alreadyHere.length === 0
      ? ''
      : alreadyHere.length === 1
        ? ` You already have ${alreadyHere[0]?.name}; yours is kept as it is.`
        : ` You already have ${alreadyHere.length} of them by name; yours are kept as they are.`;
  return `${came}. Saved here, you can log ${names.length === 1 ? 'it' : 'them'} again from your Library.${kept}`;
}
