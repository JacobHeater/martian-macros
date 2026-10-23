import type { TimedFood } from './TimedFood';
import type { UsualDay } from './UsualDay';

/** Days with meal times the usual day waits for (owner, 2026-10-22: built now, its wait said openly). */
const needed = 7;
const everyMinutes = 15;

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[middle] as number) : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
};

/**
 * The usual day from `days`, each one day's foods (MM-572). A day counts when
 * it has food and every food with calories in it has a time, so a day half
 * placed at guessed meal times never shapes it. The curve is, every 15
 * minutes, the median of what those days had eaten by then.
 */
export function usualDayOf(days: readonly (readonly TimedFood[])[]): UsualDay {
  const timed = days.filter((foods) => {
    const eaten = foods.filter((food) => food.kcal > 0);
    return eaten.length > 0 && eaten.every((food) => food.eatenAt !== undefined);
  });
  if (timed.length < needed) return { timedDays: timed.length, needed, curve: undefined };
  const curve: (readonly [number, number])[] = [];
  for (let minute = 0; minute <= 24 * 60; minute += everyMinutes) {
    const byThen = timed.map((foods) =>
      foods.reduce((sum, food) => (food.kcal > 0 && (food.eatenAt as number) <= minute ? sum + food.kcal : sum), 0),
    );
    curve.push([minute, median(byThen)]);
  }
  return { timedDays: timed.length, needed, curve };
}
