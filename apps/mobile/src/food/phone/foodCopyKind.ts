import type { FoodCopy } from '../../transfer/FoodCopy';

/** What a copy holds, in a word for its title and for what was added (MM-715, MM-718): "foods", "water" or "foods and water". */
export function foodCopyKind(copy: FoodCopy): string {
  return [...(copy.entries.length === 0 ? [] : ['foods']), ...(copy.water.length === 0 ? [] : ['water'])].join(' and ');
}
