import type { FoodEntry } from '../../FoodEntry';
import type { UsualFood } from './UsualFood';

/**
 * The foods logged at least `atLeast` times among `entries`, by name and
 * ignoring case, as MM-639 counts what is usual, over every meal (MM-706).
 * Most often first, then by name. A food logged from one of the person's own
 * foods (the origin pack `custom`), or whose name is among `except` (their
 * saved foods), is theirs already and is left out.
 */
export function usualFoodsIn(
  entries: readonly FoodEntry[],
  { atLeast = 2, except = [] }: { atLeast?: number; except?: readonly string[] } = {},
): UsualFood[] {
  const skip = new Set(except.map((name) => name.trim().toLowerCase()));
  const counts = new Map<string, { times: number; latest: FoodEntry }>();
  for (const entry of entries) {
    if (entry.portion?.origin?.packId === 'custom') continue;
    const key = entry.name.trim().toLowerCase();
    if (key === '' || skip.has(key)) continue;
    const before = counts.get(key);
    counts.set(key, {
      times: (before?.times ?? 0) + 1,
      latest:
        before === undefined ||
        before.latest.date.epochDay < entry.date.epochDay ||
        (before.latest.date.epochDay === entry.date.epochDay && before.latest.id < entry.id)
          ? entry
          : before.latest,
    });
  }
  return [...counts.values()]
    .filter((usual) => usual.times >= atLeast)
    .map((usual) => ({ name: usual.latest.name, times: usual.times, latest: usual.latest }))
    .sort((a, b) => b.times - a.times || a.name.localeCompare(b.name));
}
