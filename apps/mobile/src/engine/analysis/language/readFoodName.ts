import type { FoodLexiconIndex } from './FoodLexiconIndex';
import type { FoodMatch } from './FoodMatch';
import type { FoodNameReading } from './FoodNameReading';
import type { FoodSense } from './FoodSense';
import { FoodTag } from './FoodTag';
import type { FoodToken } from './FoodToken';
import { foodLexicon } from './foodLexicon';
import { foodTokensOf } from './foodTokensOf';
import { indexFoodLexicon } from './indexFoodLexicon';

/** `foodLexicon`, indexed once. */
const index = indexFoodLexicon(foodLexicon);

const tagOrder: readonly FoodTag[] = FoodTag.values;

const tagSenses: ReadonlySet<FoodSense> = new Set<FoodSense>(FoodTag.values);

const drinks: ReadonlySet<FoodSense> = new Set<FoodSense>(['drink', 'sugaryDrink', 'dietDrink', 'alcohol']);

/** The cues a flavor keeps: "diet cherry flavored cola" is still a diet drink. */
const keptByFlavor: ReadonlySet<FoodSense> = new Set<FoodSense>(['sugarFree', 'packedIn', 'flavor', 'without']);

/** Cues that say what a food is as well as its tags do, for finding the head. */
const headCues: ReadonlySet<FoodSense> = new Set<FoodSense>([
  'sauceHead', 'sweet', 'butter', 'flavorCarrier', 'snackBar', 'takesFlavors',
]);

/** Heads whose other words are flavors (`carriesFlavors`). */
const productHeads: readonly FoodSense[] = [
  'snackFood', 'candy', 'dessert', 'drink', 'sugaryDrink', 'dietDrink', 'alcohol', 'sauceHead', 'snackBar', 'takesFlavors',
];

/** What a product's other words lose: the kinds of food they name. Methods, places and qualifiers stay. */
const flavorKinds: ReadonlySet<FoodSense> = new Set<FoodSense>([
  'fruit', 'vegetable', 'nut', 'legume', 'leanProtein', 'fattyMeat', 'processedMeat', 'seafood', 'egg', 'dairy', 'cheesy',
  'creamy', 'sauced', 'refinedGrain', 'wholeGrain', 'pastry', 'dessert', 'candy', 'snackFood', 'spread', 'soup', 'salad',
  'sweet', 'butter', 'juice', 'sweetSpread', 'lean', 'leanCut', 'fattyCut', 'notLean', 'biscuit', 'proteinRich', 'creamyWord',
]);

/** Words a "without" or "for" reaches across: "for chicken and fish". */
const negationBridges: ReadonlySet<string> = new Set(['and', 'or']);

/** What a processed meat's other words lose: the meat it is made of. */
const madeOf: ReadonlySet<FoodSense> = new Set<FoodSense>(['fattyMeat', 'leanProtein', 'seafood', 'lean', 'leanCut', 'notLean']);

/** Words that end what a "flavored" reaches back to: "ice cream in a milk chocolate flavored coating". */
const flavorEnds: ReadonlySet<string> = new Set(['with', 'in', 'on', 'over', 'topped', 'served']);

/** Kinds a drink's other words keep: "chocolate latte" is sweet, "chocolate protein drink" has protein. */
const drinkFlavors: ReadonlySet<FoodSense> = new Set<FoodSense>(['sweet', 'proteinRich']);

/** Kinds a cereal's other words keep: "toasted oat cereal" is a whole grain, "frosted corn flakes" a refined one. */
const cerealFlavors: ReadonlySet<FoodSense> = new Set<FoodSense>(['refinedGrain', 'wholeGrain']);

/** Words after which the name adds to its head, not names it: "meatballs with sauce", "chicken in garlic sauce". */
const headEnds: ReadonlySet<string> = new Set(['with', 'in', 'on', 'over', 'topped', 'served', 'and']);

/**
 * The name without the parts that only repeat earlier words, as catalog
 * names repeat their variant: "COOKIES & CREAM FLAVOR SNACK BAR, COOKIES &
 * CREAM" is read as its first part, so the flavor stays a flavor.
 */
function withoutRepeats(tokens: readonly FoodToken[]): readonly FoodToken[] {
  const seen = new Set<string>();
  const kept: FoodToken[] = [];
  const parts = [...new Set(tokens.map((token) => token.part))];
  for (const part of parts) {
    const words = tokens.filter((token) => token.part === part);
    const repeat = kept.length > 0 && words.filter((token) => !token.stop).every((token) => seen.has(token.word));
    if (repeat) continue;
    for (const token of words) {
      kept.push(token);
      seen.add(token.word);
    }
  }
  return kept;
}

/**
 * The lexicon key for tokens `start` to `end`: words joined by a space within
 * a part of the name, and by ", " across parts, so only a key written with a
 * comma ("cheese, cottage", USDA's inverted names) spans one, and only at the
 * start of the name.
 */
function phraseOf(tokens: readonly FoodToken[], start: number, end: number): string {
  let phrase = tokens[start]!.word;
  for (let at = start + 1; at < end; at += 1) {
    phrase += `${tokens[at]!.part === tokens[at - 1]!.part ? ' ' : ', '}${tokens[at]!.word}`;
  }
  return phrase;
}

/** Where a "flavored" stops reaching back: a bar, chip, drink or yogurt is not made a flavor by one after it. */
function flavorStopsAt(match: FoodMatch): boolean {
  const has = (sense: FoodSense) => match.senses.includes(sense);
  return has('snackBar') || has('snackFood') || has('drink') || (has('flavorCarrier') && has('dairy'));
}

/** One way of reading the first tokens of a name: how many tokens its phrases cover, how many phrases, and the last one. */
interface Reading {
  readonly covered: number;
  readonly phrases: number;
  readonly last: FoodMatch | undefined;
  readonly before: number;
}

/**
 * The phrases of the name, chosen so that they cover the most words with the
 * fewest phrases (a phrase wins over its parts); where two readings tie, the
 * one whose later phrases are longer wins, as an English food name puts its
 * head last ("dark chocolate chip" is chocolate chips, not dark chocolate and
 * a chip). Then the flavors and the negated phrases are marked.
 */
function phrasesOf(tokens: readonly FoodToken[], lexicon: FoodLexiconIndex): FoodMatch[] {
  const best: Reading[] = [{ covered: 0, phrases: 0, last: undefined, before: -1 }];
  for (let end = 1; end <= tokens.length; end += 1) {
    const skipped = best[end - 1]!;
    let choice: Reading = { covered: skipped.covered, phrases: skipped.phrases, last: undefined, before: end - 1 };
    for (let length = 1; length <= Math.min(lexicon.longest, end); length += 1) {
      const start = end - length;
      const phrase = phraseOf(tokens, start, end);
      const senses = lexicon.phrases.get(phrase);
      // An inverted catalog name ("Milk, chocolate") is read only where it opens the name, as USDA writes it.
      if (senses === undefined || (start > 0 && phrase.includes(','))) continue;
      const prior = best[start]!;
      const covered = prior.covered + length;
      const phrases = prior.phrases + 1;
      const better =
        covered > choice.covered ||
        (covered === choice.covered &&
          (phrases < choice.phrases || (phrases === choice.phrases && length > (choice.last?.length ?? 0))));
      if (better) {
        choice = { covered, phrases, last: { start, length, phrase, senses, flavor: false, negated: false }, before: start };
      }
    }
    best[end] = choice;
  }
  const found: FoodMatch[] = [];
  for (let at = tokens.length; at > 0; at = best[at]!.before) {
    const last = best[at]!.last;
    if (last !== undefined) found.unshift(last);
  }
  // "Cheese flavored crackers", "chicken flavor ramen": the food words before a flavor, in its part of the name, are
  // the flavor, back to the nearest food that carries flavors ("protein bar, chocolate flavor" is still a bar).
  const flavored = new Set<number>();
  found.forEach((match, at) => {
    if (!match.senses.includes('flavor')) return;
    const part = tokens[match.start]?.part;
    for (let before = at - 1; before >= 0; before -= 1) {
      const earlier = found[before]!;
      const between = tokens.slice(earlier.start + earlier.length, found[before + 1]!.start);
      const ends = between.some((token) => flavorEnds.has(token.word));
      if (tokens[earlier.start]?.part !== part || flavorStopsAt(earlier) || ends) break;
      flavored.add(before);
    }
  });
  // "Without tartar sauce", "seasoning for chicken and fish": what follows a "without" or "for", in its part, is not in
  // the food, up to a word the lexicon does not know ("for super moms, plant-based protein" keeps the protein).
  const negatedAt = new Set<number>();
  found.forEach((match, at) => {
    if (!match.senses.includes('without')) return;
    let end = match.start + match.length;
    for (let next = at + 1; next < found.length; next += 1) {
      const later = found[next]!;
      const gap = tokens.slice(end, later.start);
      const unknown = gap.some((token) => !negationBridges.has(token.word));
      if (tokens[later.start]?.part !== tokens[match.start]?.part || unknown) break;
      negatedAt.add(next);
      end = later.start + later.length;
    }
  });
  return found.map((match, at) => {
    const part = tokens[match.start]?.part;
    const previous = found[at - 1];
    const negated =
      negatedAt.has(at) ||
      // "Pizza, no cheese": a "no" cancels only the phrase right after it ("No Man's Land beef jerky" is jerky).
      (previous !== undefined &&
        previous.senses.includes('noNext') &&
        previous.start + previous.length === match.start &&
        tokens[previous.start]?.part === part);
    return { ...match, flavor: flavored.has(at), negated };
  });
}

/** Whether a phrase says what a food is, for finding the head. */
function says(match: FoodMatch): boolean {
  return (
    !match.negated &&
    !match.flavor &&
    match.senses.some((sense) => tagSenses.has(sense) || drinks.has(sense) || headCues.has(sense))
  );
}

/**
 * The head of the name: the last phrase that says what the food is, in the
 * first part of the name that says anything (a brand often comes first;
 * a catalog's category word, "Snacks, potato chips", gives way to the part
 * after it), and before a "with", "in", "on" or "and" ("BBQ pulled pork slow
 * cooker sauce" is a sauce; "meatballs with spaghetti sauce" are meatballs).
 */
function headOf(tokens: readonly FoodToken[], matches: readonly FoodMatch[]): FoodMatch | undefined {
  const saying = matches.filter(says);
  // A category word is passed over only where it is a whole part of the name, as catalogs write it.
  const category = (match: FoodMatch) =>
    match.senses.includes('category') &&
    tokens.filter((token) => token.part === tokens[match.start]?.part && !token.stop).length === match.length;
  const first = saying.find((match) => !category(match)) ?? saying[0];
  if (first === undefined) return undefined;
  const part = tokens[first.start]?.part;
  const inPhrase = (at: number) => matches.some((match) => match.start <= at && at < match.start + match.length);
  const ends = tokens.findIndex(
    (token, at) => at > first.start && token.part === part && headEnds.has(token.word) && !inPhrase(at),
  );
  const candidates = saying.filter(
    (match) =>
      tokens[match.start]?.part === part &&
      (ends < 0 || match.start < ends) &&
      match.start >= first.start &&
      !category(match),
  );
  // The last strong phrase; a flavor-name drink or dessert ("tropical punch", "cheesecake") only if there is no other.
  const strong = candidates.filter((match) => !match.senses.includes('weakHead'));
  return strong.at(-1) ?? candidates.at(-1) ?? first;
}

/**
 * Whether the head is a product that carries flavors, so the kinds of food
 * the rest of the name names are its flavors: a snack, candy, dessert, drink,
 * sauce or snack bar, or a yogurt, cereal, creamer or other carrier that is
 * not bread. A dish (a pizza, a biscuit sandwich, a burrito) keeps them.
 */
function carriesFlavors(head: FoodMatch): boolean {
  const has = (sense: FoodSense) => head.senses.includes(sense);
  const grain = has('refinedGrain') || has('wholeGrain');
  // A donut, danish or toaster pastry is named after its flavor; a biscuit, croissant or muffin can be a sandwich.
  return productHeads.some(has) || (has('flavorCarrier') && !grain && !has('pastry')) || (has('pastry') && !grain);
}

/**
 * How the tagger reads a food's name (MM-617): the tokens (`foodTokensOf`),
 * less parts that only repeat earlier words; the lexicon phrases that cover
 * them best; the head of the name; and the tags left once the lexicon's rules
 * have settled the cues ("diet" makes a cola a diet drink; "flavored" makes
 * the words before it a flavor; "without" cancels what follows it; a snack's,
 * drink's or yogurt's other words are its flavor). `foodTagsOf` is its tags;
 * the lexicon analysis reads the rest.
 */
export function readFoodName(name: string, lexicon: FoodLexiconIndex = index): FoodNameReading {
  const tokens = withoutRepeats(foodTokensOf(name, lexicon));
  const matches = phrasesOf(tokens, lexicon);
  const head = headOf(tokens, matches);
  const product = head !== undefined && carriesFlavors(head);
  const drinkHead = head?.senses.some((sense) => drinks.has(sense)) === true;
  const cerealHead = head !== undefined && head.senses.includes('flavorCarrier') && !head.senses.includes('dairy');
  const kept = (sense: FoodSense) => (drinkHead && drinkFlavors.has(sense)) || (cerealHead && cerealFlavors.has(sense));
  // "Pork sausage", "beef franks": the meat a processed meat is made of is not a fatty or lean meat of its own.
  const processedHead = head?.senses.includes('processedMeat') === true;
  const senses = new Set<FoodSense>();
  for (const match of matches) {
    if (match.negated) continue;
    for (const sense of match.senses) {
      if (sense === 'sauceHead' && match !== head) continue;
      if (match.flavor && !keptByFlavor.has(sense)) continue;
      // "Strawberry cheesecake Greek yogurt", "shrimp crackers": a product's other words are its flavor.
      // A catalog's category word ("Candies, ...") keeps what it says.
      const flavorOnly = product && match !== head && !match.senses.includes('category');
      if (flavorOnly && flavorKinds.has(sense) && !kept(sense)) continue;
      if (flavorOnly && !drinkHead && drinks.has(sense)) continue;
      if (processedHead && match !== head && madeOf.has(sense)) continue;
      senses.add(sense);
    }
  }
  if (drinkHead) senses.add('drinkHead');
  for (const rule of lexicon.rules) {
    const applies =
      rule.when.some((sense) => senses.has(sense)) &&
      (rule.also.length === 0 || rule.also.some((sense) => senses.has(sense))) &&
      !rule.unless.some((sense) => senses.has(sense));
    if (!applies) continue;
    for (const sense of rule.remove) senses.delete(sense);
    for (const sense of rule.add) senses.add(sense);
  }
  return { tokens, matches, tags: new Set<FoodTag>(tagOrder.filter((tag) => senses.has(tag))) };
}
