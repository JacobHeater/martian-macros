import type { PreparationState } from '../foodCatalog/PreparationState';
import { compareStrings } from '../lang/compareStrings';

const stateWords = new Set(['raw', 'dry', 'cooked']);

/** Cooking words that vary between the cooked entries of one food. */
const methodWords = new Set([
  'boiled',
  'roasted',
  'baked',
  'fried',
  'pan-fried',
  'grilled',
  'broiled',
  'steamed',
  'simmered',
  'stewed',
  'microwaved',
  'drained',
  'with salt',
  'without salt',
  'with added salt',
  'without added salt',
]);

/**
 * A USDA-style food name split into its preparation state, the cooking
 * words that vary between entries, and the rest that identifies the food.
 */
export class ParsedFoodName {
  readonly state: PreparationState | undefined;
  readonly base: string;
  readonly methods: ReadonlySet<string>;

  constructor(state: PreparationState | undefined, base: string, methods: ReadonlySet<string>) {
    this.state = state;
    this.base = base;
    this.methods = methods;
  }

  static of(name: string): ParsedFoodName {
    const tokens = name
      .toLowerCase()
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');
    let state: PreparationState | undefined;
    const methods = new Set<string>();
    const rest: string[] = [];
    for (const t of tokens) {
      if (stateWords.has(t)) {
        state = t === 'cooked' ? 'cooked' : 'raw';
      } else if (methodWords.has(t)) {
        methods.add(t);
      } else {
        rest.push(t);
      }
    }
    rest.sort(compareStrings);
    return new ParsedFoodName(state, rest.join('|'), methods);
  }
}
