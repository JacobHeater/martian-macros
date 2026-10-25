import type { FoodSense } from './FoodSense';

/**
 * Lexicon words and phrases and what each means (MM-617). A key is written
 * the way the tokenizer reads a name: lower case, unaccented, singular, no
 * stop word, "and" for "&" and "n", one space between words; ", " joins two
 * parts of a name, for USDA's inverted names ("cheese, cottage"). An empty
 * list is a phrase that means nothing but still wins over its parts
 * ("broiler or fryer" is a kind of chicken, not a cooking method).
 */
export type FoodPhrases = Readonly<Record<string, readonly FoodSense[]>>;
