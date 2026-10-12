import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { FoodEntry } from '../domain/FoodEntry';
import { extraNutrientsLine } from '../format/extraNutrientsLine';
import { Fmt } from '../format/Fmt';
import { portionSummary } from '../format/portionSummary';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import './food.css';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * One logged food: name, macros and where the quantity came from, with its
 * energy on the right. The letters carry the meaning, not a color.
 */
export function FoodEntryTile({ entry }: { entry: FoodEntry }) {
  const { state } = useApp();
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const extras = DetailLevel.showsExtras(level) ? extraNutrientsLine(entry) : undefined;
  return (
    <span className="food-entry">
      <span className="food-entry-text">
        <span className="food-entry-name">{entry.name}</span>
        <span className="food-entry-line">
          {DetailLevel.showsCarbsAndFat(level)
            ? `P ${whole(entry.proteinG)} · C ${whole(entry.carbsG)} · F ${whole(entry.fatG)}`
            : `P ${whole(entry.proteinG)}`}
        </span>
        {extras === undefined ? null : <span className="food-entry-line food-entry-extras">{extras}</span>}
        <span className="food-entry-line food-entry-portion">{portionSummary(entry)}</span>
      </span>
      <span className="food-entry-kcal">{Fmt.whole(entry.kcal)}</span>
    </span>
  );
}
