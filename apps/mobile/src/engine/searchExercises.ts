import type { Exercise } from '../domain/training/Exercise';
import { compareStrings } from '../lang/compareStrings';

/**
 * The exercises to offer when one is being chosen (MM-76).
 *
 * With no `query`, the recently used come first, most recent first, then the
 * rest by name. With one, only exercises whose name has a word starting with
 * every word typed, and among those the recently used still come first, then
 * names that start with what was typed.
 *
 * `exercises` is the built-in library and the user's own together.
 * `recentIds` is most recent first.
 */
export function searchExercises({
  query,
  exercises,
  recentIds = [],
}: {
  query: string;
  exercises: Iterable<Exercise>;
  recentIds?: readonly string[];
}): Exercise[] {
  const typed = wordsOf(query);
  const typedName = typed.join(' ');
  const recency = new Map(recentIds.map((id, i) => [id, i]));
  const matches = [...exercises].filter((exercise) => matchesAll(typed, wordsOf(exercise.name)));

  const rank = (exercise: Exercise): number => {
    const recent = recency.get(exercise.id);
    if (recent !== undefined) return recent;
    const startsWithTyped = typed.length > 0 && wordsOf(exercise.name).join(' ').startsWith(typedName);
    return recentIds.length + (startsWithTyped ? 0 : 1);
  };

  return matches.sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return compareStrings(a.name.toLowerCase(), b.name.toLowerCase());
  });
}

/**
 * Lower-case words, with hyphens and apostrophes not counting: "pull up"
 * finds "Pull-up", and "farmers" finds "Farmer's carry".
 */
function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replaceAll("'", '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

function matchesAll(typed: readonly string[], name: readonly string[]): boolean {
  return typed.every((word) => name.some((part) => part.startsWith(word)));
}
