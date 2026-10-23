import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { FoodEntry } from '../domain/FoodEntry';
import { Fmt } from '../format/Fmt';
import { portionAmount } from '../format/portionAmount';
import { quantitySourceLabel } from '../format/quantitySourceLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIcon } from '../ui/MmIcon';
import { foodEntryLinesId } from './foodEntryLinesId';
import { methodIcon } from './methodIcon';
import { useNetCarbs } from './useNetCarbs';
import './food.css';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * One logged food: its name, its macros and how much was eaten, with its
 * energy on the right (MM-564). The letters carry the meaning, not a color;
 * the method's icon says how the amount was measured, and is heard (MM-255).
 * The other nutrients and how the totals came about are in the entry's
 * editor, one press away.
 */
export function FoodEntryTile({ entry }: { entry: FoodEntry }) {
  const { state } = useApp();
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const netCarbs = useNetCarbs();
  const method = quantitySourceLabel(entry.source);
  const amount = portionAmount(entry);
  return (
    <span className="food-entry">
      <span className="food-entry-method" role="img" aria-label={method}>
        <MmIcon name={methodIcon(entry.source)} size={20} />
      </span>
      {/* The lines carry an id so the row's press is described by them (MM-429): a reader hears the macros and the amount, not only "Edit". */}
      <span className="food-entry-text" id={foodEntryLinesId(entry)}>
        <span className="food-entry-name">{entry.name}</span>
        <span className="food-entry-line">
          {DetailLevel.showsCarbsAndFat(level)
            ? `P ${whole(entry.proteinG)} · C ${whole(netCarbs ? entry.netCarbsG : entry.carbsG)} · F ${whole(entry.fatG)}`
            : `P ${whole(entry.proteinG)}`}
        </span>
        {amount === undefined ? null : <span className="food-entry-line food-entry-portion">{amount}</span>}
        {/* How it was measured is drawn as the icon; it is still heard with the lines. */}
        <span className="mm-visually-hidden">{method}</span>
      </span>
      <span className="food-entry-kcal">{Fmt.whole(entry.kcal)}</span>
    </span>
  );
}
