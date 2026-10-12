import type { BiologicalSex } from '../domain/BiologicalSex';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { FiberDay } from '../domain/food/fiber/FiberDay';
import { fiberGuideG } from '../domain/food/fiber/fiberGuideG';
import type { FoodEntry } from '../domain/FoodEntry';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';

interface FiberLineProps {
  entries: readonly FoodEntry[];
  kcalTarget: number | undefined;
  sex: BiologicalSex | undefined;
}

/**
 * The day's fiber against its guide, at Full detail only (MM-126). A guide,
 * never judged: no "under", no streak. With too little of the day's
 * calories carrying a fiber value it says so instead of showing a total
 * that would treat missing as zero.
 */
export function FiberLine({ entries, kcalTarget, sex }: FiberLineProps) {
  const { state } = useApp();
  const level = useLoaded(state.detailLevel) ?? 'standard';
  if (!DetailLevel.showsExtras(level) || entries.length === 0) return null;
  const day = FiberDay.of(entries);
  const guide = kcalTarget === undefined || sex === undefined ? undefined : fiberGuideG({ kcalTarget, sex });
  let line: string;
  if (!day.enough) line = 'Fiber: not enough data';
  else if (guide === undefined) line = `Fiber: ${Fmt.whole(day.totalG)} g`;
  else line = `Fiber: ${Fmt.whole(day.totalG)} g · guide ${Fmt.whole(guide)} g`;
  return <p className="app-text app-muted food-line">{line}</p>;
}
